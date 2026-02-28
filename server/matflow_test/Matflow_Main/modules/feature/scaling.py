import pandas as pd
from django.http import JsonResponse
from ...modules.classes import scaler

def scaling(file):
	data=file.get("file")
	data=pd.DataFrame(data)
	variables = data.columns.to_list()
	col_options = file.get("options")
	method =file.get("method")
	default = file.get("default_value")
	columns =file.get("select_column")

	if col_options == "Select All Except":
		columns = [var for var in variables if var not in columns]
	sc = scaler.Scaler(method, columns)
	new_value = sc.fit_transform(data)
	new_value = new_value.to_dict(orient="records")
	return JsonResponse(new_value, safe=False)
