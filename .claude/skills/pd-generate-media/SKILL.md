---
name: pd-generate-media
description: Generates images, videos, and audio using Google Gemini AI models, with support for iterative ideation and version comparison.
---

# Generate media with Google Gemini

Generate images, videos, and audio using Google Gemini AI. Use this skill when the Developer needs visual, video, or audio assets for the project.

## Workflow

### 1. Gather context and build a prompt

Before generating media, build a detailed prompt using available context:

- Review the current conversation and project context for relevant details (design language, brand guidelines, existing assets, narrative tone).
- Ask the Developer clarifying questions if the request is vague. Good questions include:
  - What is the intended use of this media (UI mockup, marketing, game asset, placeholder)?
  - What style or mood should it convey?
  - Are there specific dimensions, aspect ratios, or duration requirements?
  - Should it match any existing assets or reference images?
- Craft a detailed, descriptive prompt that includes style, subject, composition, lighting, mood, and any technical constraints.
- Show the Developer the prompt before generating and ask for approval or adjustments.

### 2. Generate the media

Run the generation script via Poe. Use heredoc syntax to safely pass long prompts:

```sh
# Image (default)
cat <<'EOF' | uv run poe dev-env:agent:pd-generate-media <name>
A cozy forest tavern at dusk, warm lantern light...
EOF

# Video
cat <<'EOF' | uv run poe dev-env:agent:pd-generate-media --video <name>
A slow pan across a misty forest at dawn...
EOF

# Audio (default voice: Kore)
cat <<'EOF' | uv run poe dev-env:agent:pd-generate-media --audio <name>
A gentle piano melody with soft strings...
EOF

# Audio with a specific voice
cat <<'EOF' | uv run poe dev-env:agent:pd-generate-media --audio --voice Puck <name>
An upbeat podcast intro jingle...
EOF

# With a specific model override
cat <<'EOF' | uv run poe dev-env:agent:pd-generate-media --model gemini-2.5-flash <name>
A detailed landscape painting...
EOF
```

- `<name>` is a descriptive base filename (no extension), e.g. `hero-banner` or `intro-jingle`.
- The prompt is piped via stdin (using heredoc) to handle long or complex prompts safely.
- Output is saved to `.generated_media/<name>.<ext>`.
- Use `--model` to override the default model for any media type. If a model preference is known from conversation context, pass it explicitly.

### 3. Review and open

After generation:

- Report the output file path to the Developer.
- Ask if they would like to open it with the system viewer: `open <filepath>`.
- Share any text commentary returned by the model alongside the media.

### 4. Ideation mode: generate multiple versions

When the Developer wants to explore variations:

1. Ask how many versions they want (default: 3).
2. For each version, vary the prompt meaningfully (e.g. different style, composition, color palette, mood) while preserving the core subject.
3. Name outputs with a version suffix: `<name>-v<number>-<version-name>`, e.g. `hero-banner-v1-warm-tones`, `hero-banner-v2-cool-minimal`, `hero-banner-v3-dramatic-lighting`.
4. Generate all versions sequentially.
5. Present a summary table of all versions with their prompt variations.
6. Ask the Developer which version(s) they prefer, and whether they want further refinements based on a chosen version.

## Configuration

- Requires `PD_GEMINI_API_KEY` environment variable (typically in `.env`).
- Default models can be overridden with environment variables or the `--model` CLI flag (flag takes precedence):
  - `PD_IMAGE_GENERATION_MODEL` (default: `gemini-3.1-flash-image-preview`)
    - Other options include: `gemini-3-pro-image-preview`, `gemini-2.5-flash-image`, `imagen-4.0-generate-001`
  - `PD_VIDEO_GENERATION_MODEL` (default: `veo-3.1-generate-preview`)
  - `PD_AUDIO_GENERATION_MODEL` (default: `gemini-2.5-flash-preview-native-audio`)

## Available voices for audio

Use the `--voice` flag to select a voice. Default is `Kore`. Choose a voice that matches the tone and intent of the audio.

| Voice         | Style         |
| ------------- | ------------- |
| Zephyr        | Bright        |
| Puck          | Upbeat        |
| Charon        | Informative   |
| Kore          | Firm          |
| Fenrir        | Excitable     |
| Leda          | Youthful      |
| Orus          | Firm          |
| Aoede         | Breezy        |
| Callirrhoe    | Easy-going    |
| Autonoe       | Bright        |
| Enceladus     | Breathy       |
| Iapetus       | Clear         |
| Umbriel       | Easy-going    |
| Algieba       | Smooth        |
| Despina       | Smooth        |
| Erinome       | Clear         |
| Algenib       | Gravelly      |
| Rasalgethi    | Informative   |
| Laomedeia     | Upbeat        |
| Achernar      | Soft          |
| Alnilam       | Firm          |
| Schedar       | Even          |
| Gacrux        | Mature        |
| Pulcherrima   | Forward       |
| Achird        | Friendly      |
| Zubenelgenubi | Casual        |
| Vindemiatrix  | Gentle        |
| Sadachbia     | Lively        |
| Sadaltager    | Knowledgeable |
| Sulafat       | Warm          |

## Notes

- All generated media is saved to `.generated_media/` which is git-ignored.
- Video generation can take several minutes due to server-side rendering.
- Audio generation returns WAV files.
