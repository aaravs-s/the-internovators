from pathlib import Path
import json
import os
import tempfile
from typing import Any


def read_list(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []

    content = path.read_text(encoding="utf-8").strip()
    if not content:
        return []

    data = json.loads(content)
    if not isinstance(data, list):
        raise ValueError(f"{path.name} must contain a JSON list")
    return data


def write_list(path: Path, records: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(records, indent=2, sort_keys=True)

    with tempfile.NamedTemporaryFile(
        "w",
        encoding="utf-8",
        delete=False,
        dir=path.parent,
        suffix=".tmp",
    ) as temp_file:
        temp_file.write(serialized)
        temp_file.write("\n")
        temp_path = Path(temp_file.name)

    os.replace(temp_path, path)

