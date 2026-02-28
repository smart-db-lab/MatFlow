#!/usr/bin/env python3
"""Compare installed packages with requirements.txt to find missing packages."""

import re
from pathlib import Path

def normalize_package_name(name):
    """Normalize package name for comparison."""
    # Convert to lowercase and replace common variations
    name = name.lower().strip()
    # Handle common naming variations
    name = name.replace('_', '-')
    return name

def extract_package_name(line):
    """Extract package name from a requirements line."""
    line = line.strip()
    if not line or line.startswith('#'):
        return None
    # Split on version specifiers: ==, >=, <=, <, >, !=
    parts = re.split(r'[<>=!]', line)
    if parts:
        return normalize_package_name(parts[0])
    return None

def load_packages(filename):
    """Load package names from a file."""
    packages = set()
    filepath = Path(filename)
    if not filepath.exists():
        return packages
    
    # Try different encodings
    encodings = ['utf-8', 'latin-1', 'cp1252']
    for encoding in encodings:
        try:
            with open(filepath, 'r', encoding=encoding) as f:
                for line in f:
                    pkg = extract_package_name(line)
                    if pkg:
                        packages.add(pkg)
            break
        except UnicodeDecodeError:
            continue
    return packages

def main():
    installed = load_packages('installed_packages.txt')
    required = load_packages('requirements.txt')
    
    missing = sorted(required - installed)
    
    print("=" * 70)
    print("PACKAGE COMPARISON REPORT")
    print("=" * 70)
    print(f"\nTotal packages in requirements.txt: {len(required)}")
    print(f"Total packages in installed_packages.txt: {len(installed)}")
    print(f"Missing packages: {len(missing)}")
    print("\n" + "=" * 70)
    
    if missing:
        print("\nMISSING PACKAGES (in requirements.txt but NOT installed):")
        print("-" * 70)
        for i, pkg in enumerate(missing, 1):
            print(f"{i:3d}. {pkg}")
    else:
        print("\n✓ All required packages are installed!")
    
    # Also show packages that are installed but not in requirements
    extra = sorted(installed - required)
    if extra:
        print("\n" + "=" * 70)
        print("\nEXTRA PACKAGES (installed but NOT in requirements.txt):")
        print("-" * 70)
        for i, pkg in enumerate(extra, 1):
            print(f"{i:3d}. {pkg}")
    
    print("\n" + "=" * 70)

if __name__ == '__main__':
    main()

