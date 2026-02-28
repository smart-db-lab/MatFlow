import pandas as pd
from django.http import JsonResponse

def append (file):
    # append_name = file.get('select_dataset_you_wanna_append')
    # file_name = file.get('new_dataset_name')
    data=pd.DataFrame(file.get("file"))
    tmp = pd.DataFrame(file.get("file2"))

    temp2 = tmp.append(data)
    temp2 = temp2.reset_index()

    new_value =temp2 .to_json(orient="records")
    return JsonResponse(new_value, safe=False)