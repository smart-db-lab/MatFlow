import pandas as pd
from django.http import JsonResponse


def change_field_name(file):
    n_iter=int(file.get("number_of_columns"))
    selected = []
    # var=[]
    # var2=[]
    modified_data=pd.DataFrame(file.get("file"))
    temp_file=file.get("data")
    for i in range(n_iter):
        var = temp_file[i].get("column_name")
        selected.append(var)
        var2 = temp_file[i].get('new_field_name')
        modified_data = modified_data.rename(columns={var: var2})

    df = modified_data.to_dict(orient="records")
    return JsonResponse(df, safe=False)


