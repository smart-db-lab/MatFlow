import pandas as pd
data = [[1.0, 0.2], [0.2, 1.0]]
columns = ["A", "B"]
correlation_data = pd.DataFrame(data, columns=columns)
res_data = []
for i in range(len(columns)):
    for j in range(len(columns)):
        val = round(correlation_data.iloc[i, j], 3)
        res_data.append([j, i, val])
print(res_data)
