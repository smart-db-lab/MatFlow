# This file contains the various functions needed for training and predictions

import pandas as pd

from sklearn.ensemble import RandomForestRegressor

def GetXandY(data):
    X = data.drop(['Epsilon'], axis = 'columns')
    y = data['Epsilon']

    return X, y

@st.cache_resource
def TrainRandomForestRegressor(modelParams, trialType, highEpsilonWeight, thresholds, data):
    if (modelParams == 'foo'):
        return RandomForestRegressor()
    modelParams['max_depth']=int(modelParams['max_depth'])
    X, y = GetXandY(data)
    yWeights = ComputeWeightsForRegressor(y, trialType, highEpsilonWeight, thresholds)

    return RandomForestRegressor().set_params(**modelParams).fit(X, y, yWeights)


from sklearn.ensemble import RandomForestClassifier

def ComputeLabel(y, threshold):
    return y.apply(lambda x: 'high ε' if x >= threshold else 'low ε')

@st.cache_resource
def TrainRandomForestClassifier(modelParams, threshold, data):
    if (modelParams == 'foo'):
        return RandomForestClassifier()
    modelParams['max_depth']=int(modelParams['max_depth'])
    X, y = GetXandY(data)
    y = ComputeLabel(y, threshold)
    return RandomForestClassifier().set_params(**modelParams).fit(X, y)


def ComputeClassifierAccuracy(model, threshold, data):
    X, y = GetXandY(data)
    y = ComputeLabel(y, threshold)

    return model.score(X, y)


def SplitData(data):
    validation = data.sample(frac = .1, random_state = 82219)
    development_mask = pd.Series(True, index = data.index)
    development_mask[validation.index] = False
    development = data[development_mask].copy()
    development.reset_index(drop = True, inplace = True)
    validation.reset_index(drop = True, inplace = True)
    
    return development, validation
    

def SplitDataForFold(train_index, test_index, X, y, sample_weights = None):
    X_train, X_test = X[train_index], X[test_index]
    y_train, y_test = y[train_index], y[test_index]

    if (sample_weights is None):
        return [X_train, X_test, y_train, y_test]
    
    sample_weights_train, sample_weights_test = sample_weights[train_index], sample_weights[test_index]
    
    return [X_train, X_test, y_train, y_test, sample_weights_train, sample_weights_test]


import numpy as np
def ComputeWeightsForRegressor(y, trialType, highEpsilonWeight, thresholds):
    def ComputeWeightsForHighEpsilonWeightRegressor(data, highEpsilonWeight):
        return data.apply(lambda x: x * highEpsilonWeight if x >= 150000 else x)


    def ComputeWeightsForThresholdsRegressor(data, thresholds):
        keysInOrder = list(thresholds.keys())
        keysInOrder.sort()
        keysInOrder.remove(0)

        result = pd.Series(np.ones(data.shape).astype(int))
        for key in keysInOrder:
            result.iloc[data >= key] = thresholds[key]

        return result


    if (trialType == 'Thresholds Trial'):
        return ComputeWeightsForThresholdsRegressor(y, thresholds)

    return ComputeWeightsForHighEpsilonWeightRegressor(y, highEpsilonWeight)

def ComputeTotalInfomationUsed(row, totalFeatures):
    if (row['max_features'] == 'sqrt'):
        maxFeatures = np.sqrt(totalFeatures)
    elif (row['max_features'] == 'log2'):
        maxFeatures = np.log2(totalFeatures)
    else:
        maxFeatures = totalFeatures
        
    maxDepth = row['max_depth']
    if (np.isnan(maxDepth)):
        maxDepth = totalFeatures

    return maxFeatures * maxDepth
