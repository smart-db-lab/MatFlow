# Missing Packages Report

## Summary
- **Total packages in requirements.txt**: 253
- **Total packages in installed_packages.txt**: 216
- **Missing packages**: 52

## Missing Packages (Required but NOT Installed)

These packages are listed in `requirements.txt` but are NOT found in `installed_packages.txt`:

1. **aiohappyeyeballs** (2.6.1) - Async DNS resolver
2. **aiohttp** (3.13.2) - Async HTTP client/server
3. **aiosignal** (1.4.0) - Async signal dispatcher
4. **argon2-cffi** (25.1.0) - Argon2 password hashing
5. **argon2-cffi-bindings** (25.1.0) - Bindings for argon2-cffi
6. **bleach** (6.3.0) - HTML sanitization
7. **datasets** (4.4.1) - Hugging Face datasets library
8. **dill** (0.4.0) - Extended pickle
9. **drf-spectacular** (0.29.0) - Django REST Framework API documentation
10. **drf-spectacular-sidecar** (2025.10.1) - Sidecar for drf-spectacular
11. **drf-yasg** (1.21.11) - Django REST Framework YASG (Yet Another Swagger Generator)
12. **et-xmlfile** (2.0.0) - Excel XML file support
13. **frozenlist** (1.8.0) - Immutable list implementation
14. **google-auth-oauthlib** (1.0.0) - Google OAuth2 authentication
15. **google-generativeai** - Google Generative AI SDK
16. **gunicorn** (23.0.0) - Python WSGI HTTP Server
17. **hf-xet** (1.2.0) - Hugging Face extension
18. **huggingface_hub** (1.2.1) - Hugging Face Hub client
19. **inflection** (0.5.1) - String inflection library
20. **isodate** (0.7.2) - ISO 8601 date/time parsing
21. **jax** (0.4.30) - JAX (Just After eXecution) library
22. **jaxlib** (0.4.30) - JAX library dependencies
23. **kaggle** (1.7.4.5) - Kaggle API client
24. **lazy-object-proxy** (1.12.0) - Lazy object proxy
25. **liac-arff** (2.5.0) - ARFF file format support
26. **minio** (7.2.20) - MinIO Python SDK
27. **multidict** (6.7.0) - Multidict implementation
28. **multiprocess** (0.70.18) - Better multiprocessing
29. **oauthlib** (3.3.1) - OAuth implementation
30. **openapi-core** (0.19.5) - OpenAPI core library
31. **openapi-schema-validator** (0.6.3) - OpenAPI schema validator
32. **openapi-spec-validator** (0.7.2) - OpenAPI spec validator
33. **openml** (0.15.1) - OpenML Python API
34. **openpyxl** (3.1.5) - Excel file support
35. **parse** (1.20.2) - Parse strings using format specification
36. **propcache** (0.4.1) - Property cache decorator
37. **pycryptodome** (3.23.0) - Cryptographic library
38. **python-slugify** (8.0.4) - String slugification
39. **qcmanybody** - Quantum chemistry library
40. **requests-oauthlib** (2.0.0) - OAuth for requests
41. **rfc3339-validator** (0.1.4) - RFC3339 date/time validator
42. **shellingham** (1.5.4) - Detect shell type
43. **tensorflow-estimator** (2.15.0) - TensorFlow Estimator API
44. **tensorflow-io-gcs-filesystem** (0.31.0) - TensorFlow GCS filesystem
45. **text-unidecode** (1.3) - Text transliteration
46. **typer-slim** (0.20.0) - CLI framework
47. **uritemplate** (4.2.0) - URI template expansion
48. **webencodings** (0.5.1) - Character encoding utilities
49. **whitenoise** (6.11.0) - Static file serving for Django
50. **xmltodict** (1.0.2) - XML to dictionary converter
51. **xxhash** (3.6.0) - Extremely fast hash algorithm
52. **yarl** (1.22.0) - URL parsing library

## Extra Packages (Installed but NOT in requirements.txt)

These packages are installed but not listed in `requirements.txt` (may be dependencies or manually installed):

1. backports.tarfile
2. beartype
3. diskcache
4. jaraco.classes
5. jaraco.context
6. jaraco.functools
7. keyring
8. pathvalidate
9. pip
10. py-key-value-aio
11. py-key-value-shared
12. pywin32-ctypes
13. setuptools
14. websockets
15. wheel

## Installation Command

To install all missing packages, you can run:

```bash
pip install aiohappyeyeballs==2.6.1 aiohttp==3.13.2 aiosignal==1.4.0 argon2-cffi==25.1.0 argon2-cffi-bindings==25.1.0 bleach==6.3.0 datasets==4.4.1 dill==0.4.0 drf-spectacular==0.29.0 drf-spectacular-sidecar==2025.10.1 drf-yasg==1.21.11 et-xmlfile==2.0.0 frozenlist==1.8.0 google-auth-oauthlib==1.0.0 google-generativeai gunicorn==23.0.0 hf-xet==1.2.0 huggingface_hub==1.2.1 inflection==0.5.1 isodate==0.7.2 jax==0.4.30 jaxlib==0.4.30 kaggle==1.7.4.5 lazy-object-proxy==1.12.0 liac-arff==2.5.0 minio==7.2.20 multidict==6.7.0 multiprocess==0.70.18 oauthlib==3.3.1 openapi-core==0.19.5 openapi-schema-validator==0.6.3 openapi-spec-validator==0.7.2 openml==0.15.1 openpyxl==3.1.5 parse==1.20.2 propcache==0.4.1 pycryptodome==3.23.0 python-slugify==8.0.4 qcmanybody requests-oauthlib==2.0.0 rfc3339-validator==0.1.4 shellingham==1.5.4 tensorflow-estimator==2.15.0 tensorflow-io-gcs-filesystem==0.31.0 text-unidecode==1.3 typer-slim==0.20.0 uritemplate==4.2.0 webencodings==0.5.1 whitenoise==6.11.0 xmltodict==1.0.2 xxhash==3.6.0 yarl==1.22.0
```

Or simply reinstall from requirements.txt:

```bash
pip install -r requirements.txt
```

