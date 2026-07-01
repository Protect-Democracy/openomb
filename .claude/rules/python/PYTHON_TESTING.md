---
description: Python testing conventions and pytest patterns: file organization, mocking philosophy, fixtures, parametrize, markers.
paths:
  - "**/*.py"
  - "**/*.py*.jinja"
---

# Python Testing

Comprehensive testing conventions and pytest patterns. Tests should be fast, focused, and trustworthy — when a test passes, you should be confident the behavior works.

---

## File Organization

Consistent file placement makes tests discoverable and keeps the relationship between source and tests obvious.

### Unit tests

Unit test files live alongside source files. Each module gets one test file — do not create separate test files per function. For example

```
project/
    analysis.py
    analysis_test.py
    utils.py
    utils_test.py
    conftest.py                          # shared fixtures for unit tests
    .test_data/
        analysis_sample_config.json      # prefixed with module name
        utils_sample_input.txt
```

### Integration tests

Integration tests live in a dedicated `tests/integration/` directory, separate from unit tests. They use the `_integration_test.py` suffix. For example:

```
project/
    tests/
        integration/
            conftest.py                      # shared fixtures for integration tests
            analysis_integration_test.py
            .test_data/
                analysis_sample_project.json  # prefixed with test name
```

### Test data

Test data lives in a `.test_data/` folder next to the tests that use it. Files are prefixed with the module or test name to avoid ambiguity when multiple tests share a data directory.

### conftest.py

Use `conftest.py` for fixtures and helpers shared across multiple test files in the same directory. Never put concerns specific to a single test file in `conftest.py`. Never import from `conftest.py` directly — let pytest discover fixtures automatically.

### Pytest discovery

The `module_test.py` naming convention requires pytest configuration to discover tests:

```toml
# pyproject.toml
[tool.pytest.ini_options]
python_files = ["*_test.py", "*_integration_test.py"]
```

---

## Test Classes and Naming

Consistent naming makes test output readable and helps developers find tests for a given function.

### Structure

Use one test class per public function, with test methods named for the behavior being verified:

```python
class TestParseVersion:
    def test_extracts_semver_from_string(self) -> None:
        result = parse_version("tool 2.1.0")
        assert result == Version("2.1.0")

    def test_raises_on_missing_version(self) -> None:
        with pytest.raises(ValueError, match="No version number found"):
            parse_version("no version here")

    def test_handles_version_with_prefix_v(self) -> None:
        result = parse_version("tool v3.0.1")
        assert result == Version("3.0.1")
```

### Conventions

- **Class name**: `TestFunctionName` — matches the public function under test
- **Method name**: `test_<behavior_being_verified>` — describes the expected outcome, not the implementation
- **No `__init__`**: pytest silently skips test classes that define `__init__`
- **Arrange-Act-Assert**: each test should clearly separate setup, execution, and verification
- **Self-contained**: each test calls the function under test directly; prefer simple inline setup over shared fixtures

---

## Unit vs Integration Tests

Clear separation ensures unit tests stay fast and deterministic while integration tests verify real system interactions.

### Unit tests

Unit tests verify individual functions and methods in isolation. They live alongside source files, mock external boundaries, and should run in milliseconds.

```python
# tools_test.py — unit test mocking subprocess
import subprocess
from unittest.mock import patch

class TestCheckTool:
    def test_returns_ok_when_version_meets_minimum(self) -> None:
        mock_result = subprocess.CompletedProcess(
            args=[], returncode=0, stdout="tool 2.1.0\n", stderr=""
        )
        with patch("myapp.tools.subprocess.run", return_value=mock_result):
            tool = check_tool(make_tool(name="tool", minimum="2.0.0"))

        assert tool["status"] == ToolStatus.OK
```

### Integration tests

Integration tests verify real interactions across modules, subprocesses, and the filesystem. They live in `tests/integration/`, use real implementations, and avoid mocking internal project code.

```python
# tests/integration/generate_integration_test.py
import subprocess

class TestProjectGeneration:
    def test_generated_project_passes_linting(self, tmp_path: Path) -> None:
        """Generate a project and run the real linter against it."""
        base(tmp_path, data=PROJECT_ANSWERS)
        install(tmp_path)

        result = subprocess.run(
            ["uv", "run", "poe", "lint"],
            cwd=tmp_path,
            capture_output=True,
            text=True,
            check=False,
        )
        assert result.returncode == 0, (
            f"Linting failed:\nstdout: {result.stdout}\nstderr: {result.stderr}"
        )
```

### When to write each type

- **Unit test**: testing a pure function, a function with mockable external dependencies, or error handling paths
- **Integration test**: testing that real subprocesses produce expected output, that generated files are valid, or that multiple modules work together correctly

---

## Mocking Philosophy

Over-mocking creates false confidence — tests pass but real behavior is broken. Under-mocking makes unit tests slow and flaky. The goal is to mock at boundaries and keep internal code real.

### Mock external boundaries in unit tests

Mock subprocess calls, network requests, and third-party APIs. These are slow, unreliable, or produce side effects in tests.

```python
from unittest.mock import Mock, patch

class TestFetchData:
    def test_returns_parsed_response(self) -> None:
        mock_response = Mock(status_code=200, json=lambda: {"key": "value"})
        with patch("myapp.client.requests.get", return_value=mock_response):
            result = fetch_data("https://api.example.com/data")

        assert result == {"key": "value"}
```

### Avoid mocking project-internal code

If function A calls function B and both are in your project, test with real function B when practical. If testing A requires mocking B, that is often a sign that A is doing too much — refactor for better testability rather than adding mocks.

```python
# BAD: mocking an internal helper to test the caller
with patch("myapp.generate.validate_config"):
    result = generate_project(config)

# GOOD: use the real validate_config — it's fast and deterministic
result = generate_project(config)
```

### Use autospec=True

When mocking is necessary, always use `autospec=True`. This ensures the mock matches the real object's interface and catches signature mismatches at test time rather than in production.

```python
from unittest.mock import patch

# BAD: unspecced mock accepts any arguments silently
with patch("myapp.tools.subprocess.run") as mock_run:
    mock_run.return_value = fake_result
    # mock_run("wrong", "args") would not raise — dangerous

# GOOD: autospec enforces the real signature
with patch("myapp.tools.subprocess.run", autospec=True) as mock_run:
    mock_run.return_value = fake_result
    # mock_run("wrong", "args") raises TypeError — caught early
```

### Use monkeypatch for environment and attributes

Prefer `monkeypatch` over `patch` for environment variables and simple attribute overrides. It scopes cleanup to the test automatically.

```python
class TestConfig:
    def test_reads_api_key_from_environment(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("API_KEY", "test-key-123")
        config = load_config()
        assert config.api_key == "test-key-123"
```

### Never mock in integration tests

Integration tests exist to verify real behavior. If a test needs mocking, it belongs in the unit test suite.

---

## Fixtures

Fixtures reduce duplication and manage test state, but overuse obscures what a test actually does. Prefer simple, self-contained tests; use fixtures when sharing setup across multiple tests.

### Scope

Default to `function` scope (one fresh instance per test). Only widen to `session` or `module` for genuinely expensive resources like database connections or cloned repositories.

```python
@pytest.fixture
def sample_config(tmp_path: Path) -> Path:
    """Create a sample config file. Function-scoped by default."""
    config = tmp_path / "config.json"
    config.write_text('{"key": "value"}')
    return config
```

### Yield fixtures for setup and teardown

Use `yield` to pair setup with cleanup. Code before `yield` runs during setup; code after runs during teardown.

```python
@pytest.fixture
def temp_database(tmp_path: Path) -> Iterator[Database]:
    """Create a temporary database, clean up after test."""
    db = Database(tmp_path / "test.db")
    db.initialize()
    yield db
    db.close()
```

### Factory fixtures

When tests need multiple instances or customizable parameters, return a callable instead of a value.

```python
class GitRepo:
    """Helper for git operations in a test repository."""

    def __init__(self, path: Path) -> None:
        self.path = path

    def init(self) -> None:
        subprocess.run(["git", "init"], cwd=self.path, check=True, capture_output=True)
        subprocess.run(
            ["git", "commit", "--allow-empty", "-m", "init"],
            cwd=self.path, check=True, capture_output=True,
        )

@pytest.fixture
def git_repo() -> type[GitRepo]:
    """Factory fixture: call GitRepo(path) to wrap a directory."""
    return GitRepo
```

### Built-in fixtures

- **`tmp_path`**: provides a unique `pathlib.Path` temp directory per test. Always prefer over legacy `tmpdir`.
- **`monkeypatch`**: temporarily modify environment variables, attributes, and dict items. Automatically reverts after each test.
- **`capsys`**: capture `stdout` and `stderr` output.

### Avoid autouse

`autouse=True` runs a fixture for every test in scope without explicit request. This hides dependencies and makes tests harder to understand. Only use it for truly universal setup like configuring test-wide logging.

---

## Parametrize

Parametrize avoids duplicating test logic across similar inputs and makes test coverage explicit in output.

### Basic usage

```python
@pytest.mark.parametrize(
    "version_string, expected",
    [
        ("tool 2.1.0", Version("2.1.0")),
        ("tool v3.0.1", Version("3.0.1")),
        ("tool 0.9.0-beta", Version("0.9.0b0")),
    ],
)
def test_parse_version_extracts_version(
    version_string: str, expected: Version
) -> None:
    assert parse_version(version_string) == expected
```

### Use descriptive parameter names and IDs

Name parameters clearly (`version_string, expected` not `p1, p2`). Use `pytest.param` with `id` for readable test output.

```python
@pytest.mark.parametrize(
    "invalid_input",
    [
        pytest.param("no version here", id="missing-version"),
        pytest.param("", id="empty-string"),
        pytest.param("  \n  ", id="whitespace-only"),
    ],
)
def test_parse_version_raises_on_invalid_input(invalid_input: str) -> None:
    with pytest.raises(ValueError, match="No version number found"):
        parse_version(invalid_input)
```

### Conventions

- **Extract large parameter sets** into named constants outside the decorator for readability
- **Separate valid and invalid inputs** into different parametrized tests — do not mix conceptually different scenarios
- **Combine with `pytest.raises`** for exception cases
- **One test per behavior**: parametrize inputs that test the same behavior, not fundamentally different code paths

---

## Assertions

pytest rewrites `assert` statements to provide rich failure output showing actual vs expected values. Use plain `assert` as the primary mechanism — no special imports needed.

### Plain assert

```python
def test_user_has_expected_name(self) -> None:
    user = create_user(name="Alice")
    assert user.name == "Alice"
    assert user.is_active
    assert "admin" not in user.roles
```

### Exception testing

Use `pytest.raises` as a context manager. The `match` parameter checks the exception message with `re.search`.

```python
def test_raises_on_missing_file(self) -> None:
    with pytest.raises(FileNotFoundError, match="config.json"):
        load_config(Path("/nonexistent/config.json"))
```

### Floating-point comparisons

Use `pytest.approx` for any floating-point comparison to avoid precision issues.

```python
def test_calculates_tax(self) -> None:
    assert calculate_tax(100.0, rate=0.075) == pytest.approx(7.50)
```

### Diagnostic messages for complex failures

Include context in assert messages when failures would otherwise be hard to diagnose, especially for subprocess results.

```python
def test_command_succeeds(self, tmp_path: Path) -> None:
    result = subprocess.run(
        ["uv", "run", "poe", "test"],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, (
        f"Command failed (exit {result.returncode}):\n"
        f"stdout: {result.stdout}\nstderr: {result.stderr}"
    )
```

### One behavior per test

Each test should verify one behavior. Multiple `assert` statements verifying aspects of the same behavior are fine — but testing unrelated behaviors in one test makes failures ambiguous.

---

## Markers

Markers categorize tests for selective execution and document expected behavior.

### Registration

Register custom markers in `pyproject.toml` and enable strict mode to catch typos:

```toml
# pyproject.toml
[tool.pytest.ini_options]
markers = [
    "integration: marks tests that run real external processes or services",
]
addopts = ["--strict-markers"]
```

### Integration marker

Use `@pytest.mark.integration` on integration tests. This is intentionally redundant with the `tests/integration/` directory — it enables flexible CI selection with `pytest -m integration` or `pytest -m "not integration"`.

```python
import pytest

@pytest.mark.integration
class TestProjectGeneration:
    def test_generated_project_passes_tests(self, tmp_path: Path) -> None:
        ...
```

### Skip and xfail

Use `skip` and `skipif` for tests that only apply in certain environments. Use `xfail` to document known bugs or unimplemented features without failing the suite.

```python
import sys

@pytest.mark.skipif(sys.platform == "win32", reason="Unix-only test")
def test_unix_permissions(tmp_path: Path) -> None:
    ...

@pytest.mark.xfail(reason="Known bug #123 — fix planned for v2.1")
def test_edge_case_handling() -> None:
    ...
```

---

## Anti-Patterns

Common pitfalls that reduce test value or create maintenance burden.

| Anti-Pattern                  | Problem                                         | Fix                                                      |
| ----------------------------- | ----------------------------------------------- | -------------------------------------------------------- |
| Over-mocking                  | Tests pass but real behavior is broken          | Mock only external boundaries; use real internal code    |
| Monolithic tests              | Failures are ambiguous; hard to name            | One behavior per test                                    |
| Duplicated setup              | Copy-pasted setup across tests drifts over time | Extract to fixtures or parametrize                       |
| Testing private methods       | Couples tests to implementation details         | Test public interfaces only                              |
| Importing from conftest       | Breaks pytest fixture discovery                 | Let pytest discover fixtures automatically               |
| Flaky tests left unresolved   | Erodes trust in the test suite                  | Investigate root cause immediately; quarantine if needed |
| Autouse without justification | Hides test dependencies                         | Prefer explicit fixture requests                         |
| `__init__` in test classes    | pytest silently skips the class                 | Never define `__init__` in test classes                  |
| Using `tmpdir`                | Legacy fixture returning `py.path.local`        | Use `tmp_path` (`pathlib.Path`) instead                  |

---

## References

- [pytest documentation](https://docs.pytest.org/en/stable/)
- [Google Python Style Guide — Testing](https://google.github.io/styleguide/pyguide.html#316-naming)
- [Real Python — Effective Python Testing](https://realpython.com/pytest-python-testing/)
