from functools import lru_cache
import importlib.util
import sys
from pathlib import Path
from types import ModuleType

SRC_DIR = Path(__file__).resolve().parents[2]


@lru_cache(maxsize=64)
def load_module(relative_path: str) -> ModuleType:
    file_path = SRC_DIR / relative_path
    module_name = f"dyn_{relative_path.replace('/', '_').replace('-', '_').replace('.', '_')}"

    spec = importlib.util.spec_from_file_location(module_name, file_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Unable to load module from {file_path}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


def load_function(relative_path: str, function_name: str):
    module = load_module(relative_path)
    fn = getattr(module, function_name, None)
    if fn is None:
        raise AttributeError(f"Function '{function_name}' not found in {relative_path}")
    return fn
