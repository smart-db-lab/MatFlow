
import pickle
from modules import utils

def delete_model(models):


	for model_name in models.list_name():
		st.write('#')
		st.write('#')
		col0,col1,col2=st.columns(3)
		with col0:
			st.markdown(f'<h5>{model_name}</h5>',unsafe_allow_html=True)
		with col2:
			if st.button("🗑️ Delete",key=model_name+'del'):
				models.delete_model(model_name)

				st.success(f"{', '.join(model_name)} Deleted!")
				utils.rerun()

		with col1:
			# st.write(models.get_model(model_name))
			# st.write('hi')
			model_binary = pickle.dumps(models.get_model(model_name))
			st.download_button(
				label="📥 Download Model",
				data=model_binary,
				file_name=model_name + '.pkl',
				mime="application/octet-stream",
				key=model_name+'download',
			)
		st.markdown("<hr>", unsafe_allow_html=True)
