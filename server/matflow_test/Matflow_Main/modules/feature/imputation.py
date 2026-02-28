import pandas as pd
from django.http import JsonResponse

from ...modules import utils
from ...modules.classes import imputer

def imputation(file, data_opt):
	data=pd.Dataframe(file.get("data"))
	num_var = utils.get_numerical(data)
	null_var = utils.get_null(data)
	if null_var != []:
		var = file.get("Select columns")
		if var in num_var:
			strat, fill_group, constant = impute_num(data, var, file)
		else:
			strat, fill_group, constant = impute_cat(data, var, file)

		fill_group = None if (fill_group == "-") else fill_group
		imp = imputer.Imputer(strategy=strat, columns=[var], fill_value=constant, group_col=fill_group)

		new_value = imp.fit_transform(data)
		new_value = new_value.to_dict(orient="records")
		return JsonResponse(new_value, safe=False)


def impute_num(data, var, file):
	fill_group, constant = None, None

	strat = file.get("Strategy")

	if strat in ["mean", "median"]:
		fill_group = file.get("Group By")

	else:
		max_val = abs(data[var]).max()
		default = 0 if (data[var].dtype == int) else 0.0
		constant =file.get("Value")

	return strat, fill_group, constant

def impute_cat(data, var, file):
	fill_group, constant = None, None

	strat = file.get("strategy")

	if strat == "mode":
		mode = data[var].mode()
		mode_strat = file.get("options")

		if mode_strat == "Select Mode":
			strat =file.get( "constant")
			constant = file.get("mode_value")

		else:
			fill_group = file.get("group_by")
	else:
		constant = file.get("value")
	return strat, fill_group, constant
