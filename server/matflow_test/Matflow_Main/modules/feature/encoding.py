import pandas as pd

import numpy as np
from django.http import JsonResponse

from ...modules import utils
from ...modules.classes import encoder

def encoding(file):
    data=file.get("file")
    data=pd.DataFrame(data)
    var = file.get("select_column")
    method = file.get("method")
    add_pipeline = file.get("add_to_pipeline")
    file=file.get('data')
    if method == "Ordinal Encoding":
        return ordinal_encoding(data, var, add_pipeline,file)
    elif method == "One-Hot Encoding":
        return onehot_encoding(data, var, add_pipeline,file)
    elif method == "Target Encoding":
        return target_encoding(data, var, add_pipeline,file)


def ordinal_encoding(data, var, add_pipeline,file):
    from_zero = file.get("start_from_0") ==True
    inc_nan = file.get("include_nan") ==True
    asc_order = file.get("sort_values")  ==True
    # include null or no
    unique_val = data[var].unique() if inc_nan else data[var].dropna().unique()

    unique_val = sorted(unique_val, key=lambda val: (val is np.nan, val)) if asc_order else unique_val

    # encoding value start from 0 or 1
    enc_val = range(len(unique_val)) if from_zero else range(1, len(unique_val) + 1)

    order = file.get("set_value_order")

    ordinal_enc_dict = {val: new_val for val, new_val in zip(order, enc_val)}
    if len(ordinal_enc_dict) == len(unique_val):
        enc = encoder.Encoder(strategy="ordinal", column=var, ordinal_dict=ordinal_enc_dict)
        new_value = enc.fit_transform(data)
        new_value = new_value.to_dict(orient="records")
        return JsonResponse(new_value, safe=False)
    else:
        #return error
        return JsonResponse("")



def onehot_encoding(data, var, add_pipeline,file):
    print(data)
    print(var)
    drop_first = file.get("drop_first")

    enc = encoder.Encoder(strategy="onehot", column=var)
    new_value = enc.fit_transform(data)
    new_value = new_value.to_dict(orient="records")
    return JsonResponse(new_value, safe=False)


def target_encoding(data,  var, add_pipeline,file):
    target_var = file.get("select_target")
    enc = encoder.Encoder(strategy="target", column=var, target_var=target_var)
    new_value = enc.fit_transform(data)
    new_value = new_value.to_dict(orient="records")
    return JsonResponse(new_value, safe=False)
