import pandas as pd
from django.http import JsonResponse

from ...modules import utils
from ...modules.classes import dtype_changer

def Change_dtype(file):
	data = file.get("file")
	data = pd.DataFrame(data)
	variables = utils.get_variables(data)
	orig_dtypes = utils.get_dtypes(data)
	n_iter = file.get("number_of_columns")
	var_with_dtype = {f"{var} ({dtype})": var for (var, dtype) in zip(variables, orig_dtypes)}
	change_dict = {}
	temp_array=file.get("data")
	for i in range(int(n_iter)):
		var =temp_array[i].get("column_name")
		dtype = orig_dtypes[variables.index(var)]
		temp_var=f"{var} ({dtype})"
		desired_dtype = temp_array[i].get("desired_dtype")

		if desired_dtype in ["int", "float"]:
			desired_bits = temp_array[i].get("desired_bit_length")

		else:
			desired_bits =temp_array[i].get("desired_bit_length")
		change_dict[var_with_dtype[temp_var]] = desired_dtype
		print(change_dict)
		selected = list(change_dict.keys())
		var_with_dtype = {key: val for (key, val) in var_with_dtype.items() if val not in selected}
		print(var_with_dtype)
	status = [change_check(data, var, dtype) for (var, dtype) in change_dict.items()]

	if all(status):
		chg = dtype_changer.DtypeChanger(change_dict)
		new_value = chg.fit_transform(data)
		df = new_value.to_dict(orient="records")
		return JsonResponse(df, safe=False)

#
def change_check(data, var, dtype):
	try:
		data[var].astype(dtype)
		return True
	except:
		return False
