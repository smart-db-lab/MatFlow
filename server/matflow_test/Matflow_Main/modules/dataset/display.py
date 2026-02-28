import time


import pandas as pd
from modules import utils

import pandas as pd
import time

from modules import utils
def info(data):
	try:

		row, col = data.shape
		info = pd.DataFrame({
			"Column": data.columns,
			"Non-Null": data.count(axis=0).to_list(),
			"Null Percentage": [f"{x:.2f} %" for x in data.isna().sum() / row * 100],
			"Unique": utils.get_nunique(data),
			"Dtype": utils.get_dtypes(data)
		})

		dtypes = info.Dtype.value_counts()
		mem = data.memory_usage(deep=True).sum()
		if mem < 1024:
			mem = F"{mem}+ bytes"
		if mem < 1048576:
			mem = F"{(mem / 1024).round(2)}+ KB"
		else:
			mem = f"{(mem / 1024 / 1024).round(2)}+ MB"
		st.markdown('<h6>Dataset Information</h6>', unsafe_allow_html=True)
		st.text(f"""
				{type(data)}
				RangeIndex: {row} entries, 0 to {row - 1}
				Data columns (total {col} columns)
			""")
		st.dataframe(info)
		st.text(f"""
				dtypes: {", ".join([f"{i}({v})" for i, v in dtypes.items()])}
				memory usage: {mem}
			""")
	except:
		st.write('')
# def show_table(file_):
# 	if 'btn_state' not in st.session_state:
# 		st.session_state.btn_state=False

# 	col1,col3,col2=st.columns([7,1,3])
# 	with st.container():
# 		with col1:
# 			st.markdown(f'<h6> {file_.file_name} </h6>',unsafe_allow_html=True)
# 			file_data=file_.file_data
# 			st.table(file_data.head())
# 		with col2:
# 			info(file_data)
# 		co1, co3 , co2 = st.columns([7, 2, 2])
# 		with co3:
# 			if st.button('edit',type='primary'):
# 				st.session_state.btn_state=True
# 		with co2:
# 			save=st.button('save',type='primary')
# 		if st.session_state.btn_state:
# 			opn = st.radio('', options=['field name', 'data type'])
# 			if opn == 'data type':
# 				change_dtype.change_dtype(file_.file_data,0)
# 			elif opn == 'field name':
# 				change_fieldname.change_field_name(file_)



st.markdown('''
	<style>
	.block-container
	{
	 width:80vw !important;
	}
	</style>
	''', unsafe_allow_html=True)
