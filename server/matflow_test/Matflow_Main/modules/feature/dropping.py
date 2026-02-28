import pandas as pd
import numpy as np
from django.http import JsonResponse

from ...modules import utils
from ...modules.classes import dropper

def drop_column(file ):
	data=pd.DataFrame(file.get("file"))
	# option =file.get("default_columns")
	drop_var = file.get("select_columns")
	# add_pipeline = file.get("add_to_pipeline")

	if drop_var:
		drp = dropper.Dropper(drop_var)
		new_value = drp.fit_transform(data)
		new_value = new_value.to_dict(orient="records")
		return JsonResponse(new_value, safe=False)

def drop_row(file):
	print(file)
	data=pd.DataFrame(file.get("file"))
	# option = file.get("default_columns")
	# add_pipeline = file.get("Add To Pipeline", True, key="drop_add_row_pipeline")

	drop_var = file.get("select_columns")
	if drop_var:
		new_value = data.dropna(subset=drop_var)
		new_value = new_value.to_dict(orient="records")
		return JsonResponse(new_value, safe=False)
