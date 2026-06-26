"""Generate images, videos, or audio using Google Gemini AI.

Reads the prompt from stdin to safely handle long or complex prompts.
Uses heredoc syntax for multi-line prompts:

    cat <<'EOF' | uv run poe dev-env:agent:pd-generate-media hero-image
    A cozy forest tavern at dusk, warm lantern light
    EOF

    cat <<'EOF' | uv run poe dev-env:agent:pd-generate-media --video forest-pan
    A slow pan across a misty forest at dawn
    EOF

    cat <<'EOF' | uv run poe dev-env:agent:pd-generate-media --audio intro-music
    A gentle piano melody with soft strings
    EOF

Output is saved to .generated_media/<name>.<ext>
Requires PD_GEMINI_API_KEY environment variable.
"""

import base64
import os
import sys
import time
import wave
from pathlib import Path

import click
from google import genai
from google.genai import types

OUTPUT_DIR = Path(".generated_media")

# Default models, overridable via PD_* environment variables or --model flag
DEFAULT_IMAGE_MODEL = "gemini-3.1-flash-image-preview"
DEFAULT_VIDEO_MODEL = "veo-3.1-generate-preview"
DEFAULT_AUDIO_MODEL = "gemini-2.5-flash-preview-native-audio"

# Environment variable names for model overrides
_MODEL_ENV_VARS = {
    "image": "PD_IMAGE_GENERATION_MODEL",
    "video": "PD_VIDEO_GENERATION_MODEL",
    "audio": "PD_AUDIO_GENERATION_MODEL",
}

_MODEL_DEFAULTS = {
    "image": DEFAULT_IMAGE_MODEL,
    "video": DEFAULT_VIDEO_MODEL,
    "audio": DEFAULT_AUDIO_MODEL,
}


def _read_prompt_from_stdin() -> str:
    """Read the full prompt from stdin.

    Returns:
        The prompt text stripped of leading/trailing whitespace.
    """
    if sys.stdin.isatty():
        return ""
    return sys.stdin.read().strip()


def _ensure_output_dir() -> None:
    """Create the output directory if it does not exist."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def _resolve_model(media_type: str, model_override: str | None) -> str:
    """Resolve which model to use for generation.

    Priority: CLI --model flag > environment variable > default.

    Args:
        media_type: One of "image", "video", or "audio".
        model_override: Explicit model from the --model CLI flag, or None.

    Returns:
        The resolved model identifier string.
    """
    if model_override:
        return model_override
    env_var = _MODEL_ENV_VARS[media_type]
    return os.environ.get(env_var, _MODEL_DEFAULTS[media_type])


def _build_client() -> genai.Client:
    """Build a Google GenAI client using PD_GEMINI_API_KEY.

    Returns:
        A configured GenAI client.

    Raises:
        SystemExit: If PD_GEMINI_API_KEY is not set.
    """
    api_key = os.environ.get("PD_GEMINI_API_KEY")
    if not api_key:
        click.echo(
            "Error: PD_GEMINI_API_KEY environment variable is required.",
            err=True,
        )
        sys.exit(1)
    return genai.Client(api_key=api_key)


def _generate_image(
    client: genai.Client,
    prompt: str,
    name: str,
    model: str,
) -> None:
    """Generate an image and save it to disk.

    Args:
        client: The GenAI client.
        prompt: The text prompt for image generation.
        name: Base filename for the output (no extension).
        model: The model identifier to use.

    Raises:
        SystemExit: If no image is returned by the model.
    """
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        ),
    )

    candidates = response.candidates or []
    if not candidates:
        click.echo("No response returned from the model.", err=True)
        sys.exit(1)

    parts = candidates[0].content.parts if candidates[0].content else []
    saved = False

    for part in parts or []:
        if part.inline_data and part.inline_data.data:
            mime_type = part.inline_data.mime_type or "image/png"
            ext = mime_type.split("/")[1] if "/" in mime_type else "png"
            filename = f"{name}.{ext}"
            filepath = OUTPUT_DIR / filename

            image_bytes = part.inline_data.data
            if isinstance(image_bytes, str):
                image_bytes = base64.b64decode(image_bytes)

            filepath.write_bytes(image_bytes)
            click.echo(f"Saved: {filepath}")
            saved = True
        elif part.text:
            click.echo(part.text)

    if not saved:
        click.echo("No image returned.", err=True)
        sys.exit(1)


def _generate_video(
    client: genai.Client,
    prompt: str,
    name: str,
    model: str,
) -> None:
    """Generate a video and save it to disk.

    Uses long-running operation polling since video generation
    takes significant time on the server.

    Args:
        client: The GenAI client.
        prompt: The text prompt for video generation.
        name: Base filename for the output (no extension).
        model: The model identifier to use.
    """
    click.echo(f"Generating video with {model}...")

    operation = client.models.generate_videos(
        model=model,
        prompt=prompt,
    )

    # Poll until the video is ready
    while not operation.done:
        click.echo("Waiting for video generation to complete...")
        time.sleep(10)
        operation = client.operations.get(operation)

    response = operation.response
    if not response or not response.generated_videos:
        click.echo("No video returned.", err=True)
        sys.exit(1)

    video = response.generated_videos[0].video
    if not video:
        click.echo("No video file in response.", err=True)
        sys.exit(1)

    filename = f"{name}.mp4"
    filepath = OUTPUT_DIR / filename

    video_bytes = client.files.download(file=video)
    filepath.write_bytes(video_bytes)

    click.echo(f"Saved: {filepath}")


def _generate_audio(
    client: genai.Client,
    prompt: str,
    name: str,
    model: str,
    voice: str,
) -> None:
    """Generate audio and save it to disk as a WAV file.

    Args:
        client: The GenAI client.
        prompt: The text prompt for audio generation.
        name: Base filename for the output (no extension).
        model: The model identifier to use.
        voice: The Gemini voice name to use (e.g. "Kore", "Puck").

    Raises:
        SystemExit: If no audio is returned by the model.
    """
    click.echo(f"Generating audio with voice: {voice}")
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=voice,
                    ),
                ),
            ),
        ),
    )

    candidates = response.candidates or []
    if not candidates:
        click.echo("No response returned from the model.", err=True)
        sys.exit(1)

    parts = candidates[0].content.parts if candidates[0].content else []
    saved = False

    for part in parts or []:
        if part.inline_data and part.inline_data.data:
            filename = f"{name}.wav"
            filepath = OUTPUT_DIR / filename

            audio_bytes = part.inline_data.data
            if isinstance(audio_bytes, str):
                audio_bytes = base64.b64decode(audio_bytes)

            with wave.open(str(filepath), "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(24000)
                wf.writeframes(audio_bytes)

            click.echo(f"Saved: {filepath}")
            saved = True
        elif part.text:
            click.echo(part.text)

    if not saved:
        click.echo("No audio returned.", err=True)
        sys.exit(1)


@click.command()
@click.option("--video", "media_type", flag_value="video", help="Generate a video.")
@click.option("--audio", "media_type", flag_value="audio", help="Generate audio.")
@click.option(
    "--image",
    "media_type",
    flag_value="image",
    default=True,
    help="Generate an image (default).",
)
@click.option(
    "--model",
    "model_override",
    default=None,
    help="Override the model for generation (takes precedence over env vars).",
)
@click.option(
    "--voice",
    default=None,
    help="Voice name for audio generation (default: Kore). Ignored for non-audio.",
)
@click.argument("name", required=False)
def main(
    media_type: str,
    name: str | None,
    model_override: str | None,
    voice: str | None,
) -> None:
    """Generate media using Google Gemini AI.

    Reads the prompt from stdin. NAME is an optional base filename
    for the output (no extension). Defaults to '<type>-<timestamp>'.
    """
    prompt = _read_prompt_from_stdin()
    if not prompt:
        click.echo(
            "Usage: cat <<'EOF' | uv run poe dev-env:agent:pd-generate-media"
            " [--video|--audio] [--model MODEL] <name>\n"
            "<prompt>\n"
            "EOF",
            err=True,
        )
        sys.exit(1)

    _ensure_output_dir()

    if name is None:
        name = f"{media_type}-{int(time.time())}"

    model = _resolve_model(media_type, model_override)
    client = _build_client()

    if media_type == "audio":
        _generate_audio(client, prompt, name, model, voice=voice or "Kore")
    elif media_type == "video":
        _generate_video(client, prompt, name, model)
    else:
        _generate_image(client, prompt, name, model)


if __name__ == "__main__":
    main()
