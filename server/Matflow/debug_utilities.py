import inspect
import sys
import os
import datetime
import json
from functools import wraps

# Debug levels
DEBUG = 10
INFO = 20
WARNING = 30
ERROR = 40
CRITICAL = 50

# Current debug level - change this to control verbosity
CURRENT_DEBUG_LEVEL = DEBUG

# Color codes for terminal output
COLORS = {
    DEBUG: '\033[94m',  # Blue
    INFO: '\033[92m',   # Green
    WARNING: '\033[93m',  # Yellow
    ERROR: '\033[91m',  # Red
    CRITICAL: '\033[95m',  # Magenta
    'RESET': '\033[0m'  # Reset color
}

def debug_print(message, level=DEBUG, show_caller=True):
    """Print debug message with caller information if level is sufficient"""
    if level >= CURRENT_DEBUG_LEVEL:
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Get caller information
        caller_info = ""
        if show_caller:
            frame = inspect.currentframe().f_back
            filename = os.path.basename(frame.f_code.co_filename)
            lineno = frame.f_lineno
            func_name = frame.f_code.co_name
            caller_info = f"{filename}:{func_name}:{lineno}"
        
        # Get level name
        level_name = {
            DEBUG: "DEBUG",
            INFO: "INFO",
            WARNING: "WARNING",
            ERROR: "ERROR",
            CRITICAL: "CRITICAL"
        }.get(level, "UNKNOWN")
        
        # Format the message - handle different types
        if isinstance(message, (dict, list, tuple)):
            try:
                formatted_message = json.dumps(message, indent=2)
            except:
                formatted_message = str(message)
        else:
            formatted_message = str(message)
        
        # Construct the output
        output = f"{COLORS.get(level, '')}{timestamp} | {level_name} | {caller_info} | {formatted_message}{COLORS['RESET']}"
        
        print(output)

def debug(message):
    debug_print(message, DEBUG)

def info(message):
    debug_print(message, INFO)

def warning(message):
    debug_print(message, WARNING)

def error(message):
    debug_print(message, ERROR)

def critical(message):
    debug_print(message, CRITICAL)


def debug_obj(obj, name="Object", max_depth=1, current_depth=0):
    """
    Debug an object's attributes and values with protection against dictionary modification
    and special handling for Django request objects.

    Args:
        obj: Object to debug
        name: Name to display for the object
        max_depth: Maximum recursion depth for nested objects
        current_depth: Current recursion depth (used internally)
    """
    # Skip if we've gone too deep
    if current_depth > max_depth:
        debug(f"{' ' * current_depth}[Max depth reached]")
        return

    # Start object debug section
    debug(f"--- {name} ---")

    # Special handling for Django HttpRequest objects
    if str(type(obj)).endswith("HttpRequest'>"):
        debug_django_request(obj)
        debug(f"--- End {name} ---")
        return

    # Handle objects with __dict__ attribute
    if hasattr(obj, '__dict__'):
        try:
            # Create a safe copy of the dictionary to prevent modification during iteration
            attrs_dict = dict(obj.__dict__)
            for attr, value in attrs_dict.items():
                # Skip private attributes, callables, and modules
                if attr.startswith('_') or callable(value) or str(type(value)).startswith("<class 'module"):
                    continue

                # Safe string conversion with truncation for large values
                safe_value = get_safe_value_str(value)
                debug(f"{attr}: {safe_value}")
        except Exception as e:
            debug(f"Error inspecting object: {str(e)}")
    else:
        # For objects without __dict__, convert the whole object to string safely
        debug(get_safe_value_str(obj))

    debug(f"--- End {name} ---")


def debug_django_request(request):
    """
    Debug a Django request object with targeted attribute inspection.
    """
    # Session information (safe - does not include actual session data)
    debug(f"Session key: {request.session.session_key}")

    # Safe request attributes
    safe_attributes = [
        'path', 'method', 'content_type', 'GET', 'POST',
        'scheme', 'is_secure', 'is_ajax'
    ]

    for attr in safe_attributes:
        if hasattr(request, attr):
            try:
                value = getattr(request, attr)
                debug(f"{attr}: {get_safe_value_str(value)}")
            except Exception as e:
                debug(f"Error getting {attr}: {str(e)}")

    # Log request headers (if available)
    if hasattr(request, 'headers'):
        debug("Headers:")
        for key, value in request.headers.items():
            debug(f"  {key}: {value}")

    # Show query parameters
    debug("Query parameters:")
    for key, value in request.GET.items():
        debug(f"  {key}: {value}")

    # Show POST data (if not empty)
    if request.method == 'POST' and request.POST:
        debug("POST data:")
        for key, value in request.POST.items():
            debug(f"  {key}: {value}")


def get_safe_value_str(value, max_length=500):
    """
    Convert a value to string safely with length limits.
    """
    try:
        if isinstance(value, (dict, list, tuple, set)):
            # For collections, limit the content
            return f"{type(value).__name__} with {len(value)} items"
        else:
            # Convert to string and truncate if needed
            value_str = str(value)
            if len(value_str) > max_length:
                return value_str[:max_length] + "... [truncated]"
            return value_str
    except Exception as e:
        return f"<Error representing value: {str(e)}>"

def debug_function(func):
    """Decorator to debug function calls with parameters and return values"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        func_name = func.__name__
        debug(f"Calling {func_name} with args: {args} kwargs: {kwargs}")
        result = func(*args, **kwargs)
        debug(f"{func_name} returned: {result}")
        return result
    return wrapper

def set_debug_level(level):
    """Set the current debug level"""
    global CURRENT_DEBUG_LEVEL
    CURRENT_DEBUG_LEVEL = level