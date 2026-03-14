function Docs({ section }) {
  const content = {
    addModify: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">
          Add/Modify Features
        </h2>
        <p className="mb-8 text-lg text-gray-800">
          This guide helps you to create new columns or modify existing data in
          your dataset using intuitive steps and options. Here's how you can use
          the features effectively:
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            1. Adding a New Column
          </h3>
          <p className="mb-4 text-gray-700">
            Add a new column to the dataset with one of these methods:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-2">
              <strong>New Column:</strong> Add a column with a static value or
              pre-defined data.
              <br />
              <em>Example:</em> Create a column <code>Status</code> with the
              value <code>Active</code>.
            </li>
            <li className="mb-2">
              <strong>Math Operation:</strong> Generate a column using formulas
              involving existing columns.
              <br />
              <em>Example:</em> Compute <code>Area</code> using{" "}
              <code>Length * Width</code>.
            </li>
            <li className="mb-2">
              <strong>Extract Text:</strong> Extract patterns from text columns
              using regex.
              <br />
              <em>Example:</em> Extract uppercase words using{" "}
              <code>[A-Z]{"{2,}"}</code>.
            </li>
            <li className="mb-2">
              <strong>Group Numerical:</strong> Bin numerical values into
              ranges.
              <br />
              <em>Example:</em> Divide <code>Age</code> into <code>0-20</code>,{" "}
              <code>21-40</code>, etc.
            </li>
            <li className="mb-2">
              <strong>Group Categorical:</strong> Combine categories into one
              group.
              <br />
              <em>Example:</em> Merge <code>Small</code>, <code>Medium</code>,
              and <code>Large</code> into <code>Size</code>.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            2. Save as New Dataset
          </h3>
          <p className="mb-6 text-gray-700">
            Save the modified dataset as a separate file while retaining the
            original dataset.
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>New Dataset Name:</strong> Enter the name for the new
              dataset containing the changes.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            3. Modify Existing Data
          </h3>
          <p className="mb-6 text-gray-700">
            Adjust current dataset columns with these tools:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-4">
              <strong>Progress Apply:</strong> Apply functions to modify data.
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>Compute molecular features using RDKit.</li>
                <li>Convert chemical InChI to InChIKey.</li>
              </ul>
            </li>
            <li>
              <strong>Replace Value:</strong> Replace specific values in a
              column with new ones.
              <br />
              <em>Example:</em> Change <code>NULL</code> in <code>Status</code>{" "}
              to <code>Unknown</code>.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            4. Add to Pipeline
          </h3>
          <p className="mb-6 text-gray-700">
            Save operations to a pipeline for repeatable preprocessing.
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>Show Sample:</strong> Preview a snippet of the dataset
              with your changes.
            </li>
          </ul>
        </section>
      </div>
    ),
    changeDtype: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">
          Change Data Type
        </h2>
        <p className="mb-8 text-lg text-gray-800">
          Use this tool to change the data type of one or more columns in your
          dataset. You can specify the desired type and even adjust the bit
          length for numerical types.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            1. Supported Data Types
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-2">
              <strong>int:</strong> Whole numbers. Optionally specify the bit
              length (e.g., 8, 16, 32, 64).
            </li>
            <li className="mb-2">
              <strong>float:</strong> Decimal numbers. You can adjust the
              precision.
            </li>
            <li className="mb-2">
              <strong>complex:</strong> Numbers with both real and imaginary
              parts.
            </li>
            <li className="mb-2">
              <strong>str:</strong> Text or string values.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            2. Steps to Change Data Type
          </h3>
          <ol className="list-decimal list-inside text-gray-700">
            <li className="mb-4">
              Select the columns you want to modify from the dropdown menu.
            </li>
            <li className="mb-4">
              Choose the desired data type for each column.
            </li>
            <li className="mb-4">
              For numerical types (int, float), specify the desired bit length
              if applicable.
            </li>
            <li>
              Click <strong>Submit</strong> to apply the changes.
            </li>
          </ol>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            3. Add to Pipeline
          </h3>
          <p className="mb-6 text-gray-700">
            Save these transformations to a pipeline for future use. This
            ensures consistent preprocessing across datasets.
          </p>
        </section>
      </div>
    ),
    alterFieldName: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">
          Alter Field Name
        </h2>
        <p className="mb-8 text-lg text-gray-800">
          Use this tool to rename one or more columns in your dataset. Renaming
          columns can help improve readability and align with naming
          conventions.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Steps to Alter Field Name
          </h3>
          <ol className="list-decimal list-inside text-gray-700">
            <li className="mb-4">
              Select the column(s) you want to rename from the dropdown menu.
            </li>
            <li className="mb-4">
              Enter the new name for the selected column(s) in the provided
              input field.
            </li>
            <li className="mb-4">
              Click <strong>Save</strong> to apply the changes. If desired, you
              can save the modified dataset as a new file by selecting the{" "}
              <strong>Save as New Dataset</strong> option.
            </li>
          </ol>
        </section>
      </div>
    ),
    encoding: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">Encoding</h2>
        <p className="mb-8 text-lg text-gray-800">
          The encoding feature allows you to transform categorical data into
          numerical representations for easier analysis and machine learning.
          Choose one of the available encoding methods based on your
          requirements.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            1. Available Encoding Methods
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-4">
              <strong>Ordinal Encoding:</strong> Assigns a unique integer to
              each category in a column. You can:
              <ul className="list-disc list-inside ml-4">
                <li>Specify the order of values manually.</li>
                <li>Include NaN values as a category if needed.</li>
                <li>Sort values or start the encoding from zero.</li>
              </ul>
            </li>
            <li className="mb-4">
              <strong>One-Hot Encoding:</strong> Creates binary columns for each
              category in the selected column. You can choose to:
              <ul className="list-disc list-inside ml-4">
                <li>Drop the first category to avoid multicollinearity.</li>
              </ul>
            </li>
            <li>
              <strong>Target Encoding:</strong> Maps each category to the mean
              value of the target variable. Ensure you:
              <ul className="list-disc list-inside ml-4">
                <li>
                  Select both the column and the target variable for encoding.
                </li>
              </ul>
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            2. Steps to Apply Encoding
          </h3>
          <ol className="list-decimal list-inside text-gray-700">
            <li className="mb-4">
              Select the column you want to encode from the dropdown menu.
            </li>
            <li className="mb-4">
              Choose the desired encoding method from the options available.
            </li>
            <li className="mb-4">
              Configure additional options based on the selected encoding method
              (e.g., value order for Ordinal Encoding or target variable for
              Target Encoding).
            </li>
            <li>
              Click <strong>Submit</strong> to apply the encoding to the
              selected column.
            </li>
          </ol>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            3. Add to Pipeline
          </h3>
          <p className="mb-6 text-gray-700">
            Save the encoding transformation as part of a pipeline for
            reproducibility and consistent preprocessing across datasets.
          </p>
        </section>
      </div>
    ),
    scaling: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">Scaling</h2>
        <p className="mb-8 text-lg text-gray-800">
          The scaling feature helps normalize or standardize numerical data to
          improve model performance and ensure features are comparable. Select
          an appropriate scaling method based on your data and use case.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            1. Available Scaling Methods
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-4">
              <strong>Min-Max Scaler:</strong> Scales all values to a range
              between 0 and 1. Best used when:
              <ul className="list-disc list-inside ml-4">
                <li>
                  You want to preserve relative relationships in the data.
                </li>
                <li>There are no extreme outliers.</li>
              </ul>
            </li>
            <li className="mb-4">
              <strong>Standard Scaler:</strong> Standardizes data by removing
              the mean and scaling to unit variance. Suitable when:
              <ul className="list-disc list-inside ml-4">
                <li>Data follows a normal distribution.</li>
                <li>You want to center data around 0.</li>
              </ul>
            </li>
            <li>
              <strong>Robust Scaler:</strong> Scales data using the median and
              interquartile range. Useful when:
              <ul className="list-disc list-inside ml-4">
                <li>Data contains outliers.</li>
                <li>You need a robust scaling method.</li>
              </ul>
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            2. Steps to Apply Scaling
          </h3>
          <ol className="list-decimal list-inside text-gray-700">
            <li className="mb-4">
              Select the columns you want to scale from the dropdown menu.
            </li>
            <li className="mb-4">
              Choose the desired scaling method (Min-Max, Standard, or Robust
              Scaler).
            </li>
            <li className="mb-4">
              Configure any additional options if needed (e.g., selecting
              default value behavior).
            </li>
            <li>
              Click <strong>Submit</strong> to apply the scaling to the selected
              columns.
            </li>
          </ol>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            3. Add to Pipeline
          </h3>
          <p className="mb-6 text-gray-700">
            Save the scaling transformation as part of a pipeline for consistent
            preprocessing across datasets.
          </p>
        </section>
      </div>
    ),
    bestScaler: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">Best Scaler</h2>
        <p className="mb-8 text-lg text-gray-800">
          Automatically evaluates multiple scaling methods and recommends the best one 
          based on model performance using Random Forest, Decision Tree, XGBoost, and CatBoost.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            How It Works
          </h3>
          <p className="mb-4 text-gray-700">
            The system tests 7 different scaling methods on your data:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4">
            <li><strong>No Scaling</strong> - Original data unchanged</li>
            <li><strong>StandardScaler</strong> - Mean=0, std=1 normalization</li>
            <li><strong>MinMaxScaler</strong> - Scale to [0,1] range</li>
            <li><strong>RobustScaler</strong> - Uses median and IQR (outlier-resistant)</li>
            <li><strong>MaxAbsScaler</strong> - Scale by maximum absolute value</li>
            <li><strong>QuantileTransformer</strong> - Maps to normal distribution</li>
            <li><strong>PowerTransformer</strong> - Yeo-Johnson transformation</li>
          </ul>
          <p className="text-gray-700">
            Each scaler is tested with 4 models and ranked by weighted performance: 
            R² (50%), MSE (30%), and Skewness (20%).
          </p>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Required Inputs
          </h3>
          <div className="bg-primary/5 p-4 rounded-lg">
            <ul className="list-disc list-inside text-primary-dark">
              <li className="mb-2"><strong>Target Column:</strong> The column you want to predict</li>
              <li className="mb-2"><strong>Feature Columns:</strong> Numerical columns to scale (optional - auto-selects all numeric columns)</li>
              <li className="mb-2"><strong>Test Size:</strong> Portion of data for testing (default: 0.2)</li>
              <li><strong>Random State:</strong> Seed for reproducible results (default: 42)</li>
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Steps to Use
          </h3>
          <ol className="list-decimal list-inside text-gray-700">
            <li className="mb-2">Select your <strong>target column</strong> from the dropdown</li>
            <li className="mb-2">Choose <strong>feature columns</strong> to scale (or leave empty for auto-selection)</li>
            <li className="mb-2">Adjust <strong>test size</strong> slider if needed (0.1 to 0.5)</li>
            <li className="mb-2">Set <strong>random state</strong> for reproducible results</li>
            <li className="mb-2">Click <strong>Run Evaluation</strong> and wait for results</li>
          </ol>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Understanding Results
          </h3>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Best Scaler Metrics</h4>
              <ul className="list-disc list-inside text-green-700">
                <li><strong>Best Scaler:</strong> Recommended scaling method</li>
                <li><strong>Top R²:</strong> Highest explained variance score</li>
                <li><strong>Top MSE:</strong> Lowest mean squared error</li>
                <li><strong>Overall Rank:</strong> Weighted performance score</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Ranking Table</h4>
              <p className="text-gray-700">
                Shows all scalers ranked by performance. Green highlighted row is the best scaler.
                Lower overall rank = better performance.
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Performance Dashboard</h4>
              <p className="text-yellow-700">
                Visual charts showing R², MSE, and Skewness across different models and scalers.
                Download the chart for your records.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Download Options
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-2"><strong>Scaled Dataset:</strong> Your data transformed with the best scaler</li>
            <li className="mb-2"><strong>Performance Ranking:</strong> Complete evaluation results in CSV format</li>
            <li><strong>Performance Dashboard:</strong> Visual charts as PNG image</li>
          </ul>
        </section>
      </div>
    ),
    featureSelection: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">
          Feature Selection
        </h2>
        <p className="mb-8 text-lg text-gray-800">
          The feature selection module allows you to identify the most relevant
          features for your model, improving performance and reducing
          overfitting. Select the appropriate method based on your use case.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            1. Available Feature Selection Methods
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-4">
              <strong>Select K Best:</strong> Selects the top K features based
              on a scoring function. Configure:
              <ul className="list-disc list-inside ml-4">
                <li>
                  The scoring function (e.g., <code>f_classif</code> for
                  classification or <code>mutual_info_classif</code>).
                </li>
                <li>The number of features to keep.</li>
                <li>Visualize the selected features and their scores.</li>
              </ul>
            </li>
            <li className="mb-4">
              <strong>Best Overall Features:</strong> Automatically identifies
              and selects the best features for your target variable.
            </li>
            <li>
              <strong>
                Progressive Feature Selection with Cross-Validation:
              </strong>{" "}
              Uses cross-validation to iteratively select features, ensuring
              optimal performance. Configure:
              <ul className="list-disc list-inside ml-4">
                <li>The value for K-fold cross-validation.</li>
                <li>
                  The estimator (e.g., <code>ExtraTreesClassifier</code>).
                </li>
              </ul>
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            2. Steps to Perform Feature Selection
          </h3>
          <ol className="list-decimal list-inside text-gray-700">
            <li className="mb-4">
              Select the target variable for which you want to perform feature
              selection.
            </li>
            <li className="mb-4">
              Choose the feature selection method (e.g., Select K Best, Best
              Overall Features).
            </li>
            <li className="mb-4">
              Configure additional options such as scoring function, number of
              features to keep, or cross-validation settings.
            </li>
            <li>
              Click <strong>Submit</strong> to apply the feature selection and
              view the results.
            </li>
          </ol>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            3. Add to Pipeline
          </h3>
          <p className="mb-6 text-gray-700">
            Save the feature selection step as part of your pipeline to ensure
            reproducibility and consistency in preprocessing.
          </p>
        </section>
      </div>
    ),
    cluster: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">Clustering</h2>
        <p className="mb-8 text-lg text-gray-800">
          The clustering module enables grouping of data into clusters based on
          similarity. This is particularly useful for exploratory data analysis
          or unsupervised learning. Configure the clustering parameters to suit
          your dataset and objectives.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            1. Configuring Clustering
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-4">
              <strong>Number of Clusters:</strong> Specify the number of
              clusters to group the data into. Adjust this based on the expected
              structure of your dataset.
            </li>
            <li className="mb-4">
              <strong>Class Names:</strong> Provide meaningful names for each
              cluster to improve interpretability.
            </li>
            <li className="mb-4">
              <strong>Target Variable:</strong> Select the target variable if
              you are clustering based on supervised information.
            </li>
            <li>
              <strong>Display Type:</strong> Choose between different
              visualization types (e.g., graph or table) to represent the
              clustering results.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            2. Steps to Perform Clustering
          </h3>
          <ol className="list-decimal list-inside text-gray-700">
            <li className="mb-4">
              Specify the number of clusters using the slider.
            </li>
            <li className="mb-4">
              Assign names to each cluster for better readability.
            </li>
            <li className="mb-4">
              Choose the target variable and display type (e.g., graph or table)
              for visualization.
            </li>
            <li>
              Click <strong>Submit</strong> to generate the clusters and view
              the results.
            </li>
          </ol>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            3. Visualizing Clusters
          </h3>
          <p className="mb-6 text-gray-700">
            Use graphs or tables to interpret the clustering results. Ensure the
            clusters align with the expected patterns or structures in your
            dataset.
          </p>
        </section>

        <section>
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            4. Add to Pipeline
          </h3>
          <p className="mb-6 text-gray-700">
            Save the clustering step as part of your pipeline to enable
            consistent application of clustering on similar datasets in the
            future.
          </p>
        </section>
      </div>
    ),
    mergeDataset: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">
          Merge Dataset
        </h2>
        <p className="mb-8 text-lg text-gray-800">
          The merge dataset module allows you to combine two datasets based on a
          common column or index. This feature is useful for consolidating data
          from multiple sources or enriching a dataset with additional
          attributes.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            1. Merge Options
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-4">
              <strong>Left:</strong> Keeps all rows from the left dataset and
              only matching rows from the right dataset.
            </li>
            <li className="mb-4">
              <strong>Right:</strong> Keeps all rows from the right dataset and
              only matching rows from the left dataset.
            </li>
            <li className="mb-4">
              <strong>Inner:</strong> Keeps only rows that have matching values
              in both datasets.
            </li>
            <li className="mb-4">
              <strong>Outer:</strong> Keeps all rows from both datasets, filling
              with <code>NaN</code> where there are no matches.
            </li>
            <li>
              <strong>Cross:</strong> Performs the Cartesian product of both
              datasets (each row in the left dataset is matched with all rows in
              the right dataset).
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            2. Steps to Merge Datasets
          </h3>
          <ol className="list-decimal list-inside text-gray-700">
            <li className="mb-4">
              Select the dataset you want to merge with from the dropdown menu.
            </li>
            <li className="mb-4">
              Choose the merge type (Left, Right, Inner, Outer, or Cross) from
              the <strong>How</strong> field.
            </li>
            <li className="mb-4">
              Specify the column names for merging from both the left and right
              datasets.
            </li>
            <li className="mb-4">Provide a name for the new merged dataset.</li>
            <li>
              Click <strong>Merge</strong> to combine the datasets and view the
              resulting dataset.
            </li>
          </ol>
        </section>

        <section>
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            3. Add to Pipeline
          </h3>
          <p className="mb-6 text-gray-700">
            Save the merge operation as part of your pipeline to ensure
            consistent dataset merging for future projects.
          </p>
        </section>
      </div>
    ),
    splitDataset: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">
          Split Dataset
        </h2>
        <p className="mb-8 text-lg text-gray-800">
          The split dataset module is used to divide your dataset into training
          and testing subsets. This is essential for building and evaluating
          machine learning models. Customize the split ratio, stratify the
          split, and shuffle data as per your requirements.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            1. Configuration Options
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-4">
              <strong>Target Variable:</strong> Select the variable based on
              which the dataset may be stratified.
            </li>
            <li className="mb-4">
              <strong>Test Size:</strong> Specify the proportion of the dataset
              to include in the test split (e.g., 0.2 for 20%).
            </li>
            <li className="mb-4">
              <strong>Random State:</strong> Set a random seed to ensure
              reproducibility of the split.
            </li>
            <li className="mb-4">
              <strong>Stratify:</strong> Ensure that the training and testing
              sets maintain the same distribution of the target variable
              (especially useful for imbalanced datasets).
            </li>
            <li>
              <strong>Shuffle:</strong> Enable or disable shuffling of the
              dataset before splitting.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            2. Steps to Split a Dataset
          </h3>
          <ol className="list-decimal list-inside text-gray-700">
            <li className="mb-4">
              Select the target variable for stratification (if required).
            </li>
            <li className="mb-4">
              Specify the test size, random state, and whether or not to shuffle
              the data.
            </li>
            <li className="mb-4">
              Provide names for the resulting training and testing datasets.
            </li>
            <li>
              Click <strong>Submit</strong> to execute the split and save the
              resulting datasets.
            </li>
          </ol>
        </section>
      </div>
    ),
    buildModel: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">Build Model</h2>
        <p className="mb-8 text-lg text-gray-800">
          The Build Model module allows you to train and evaluate machine
          learning models using the datasets generated during the split. This
          module supports both classification and regression tasks, depending on
          the target variable type (categorical or numerical).
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            1. Configuration Options
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-4">
              <strong>Select Train/Test Dataset:</strong> Choose the datasets
              created during the split process for training and testing the
              model.
            </li>
            <li className="mb-4">
              <strong>Model Type:</strong> Automatically detects the type of
              model to train based on the target variable. It will use
              regression for numerical targets and classification for
              categorical targets.
            </li>
            <li className="mb-4">
              <strong>Classifier/Regressor:</strong> Select an appropriate
              algorithm (e.g., K-Nearest Neighbors, Linear Regression) for
              training the model.
            </li>
            <li className="mb-4">
              <strong>Hyperparameter Optimization:</strong> Configure
              optimization settings:
              <ul className="list-disc list-inside ml-4">
                <li>Number of iterations for hyperparameter search.</li>
                <li>Number of cross-validation folds.</li>
                <li>Random state for reproducibility.</li>
              </ul>
            </li>
            <li>
              <strong>Model Settings:</strong> Customize specific model
              parameters (e.g., number of neighbors for KNN, weight function,
              distance metric).
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            2. Steps to Build a Model
          </h3>
          <ol className="list-decimal list-inside text-gray-700">
            <li className="mb-4">
              Select the train and test datasets generated from the split
              process.
            </li>
            <li className="mb-4">
              Choose the model type (classification or regression) and specify
              the algorithm.
            </li>
            <li className="mb-4">
              Configure hyperparameter optimization settings and run the
              optimization to find the best model parameters.
            </li>
            <li className="mb-4">
              Adjust the model-specific settings as required.
            </li>
            <li>
              Click <strong>Submit</strong> to train the model and view
              performance metrics.
            </li>
          </ol>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            3. Hyperparameter Optimization
          </h3>
          <p className="mb-6 text-gray-700">
            Use hyperparameter optimization to automatically search for the best
            parameters for your model. This includes specifying the number of
            iterations, cross-validation folds, and random state. The resulting
            best estimator is displayed for your reference.
          </p>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            4. Model Performance Metrics
          </h3>
          <p className="mb-6 text-gray-700">
            After training the model, view key performance metrics such as
            accuracy, precision, recall, and F1-score (for classification) or
            R-squared and RMSE (for regression). Use these metrics to evaluate
            model performance.
          </p>
        </section>
      </div>
    ),
    modelEvaluation: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">
          Model Evaluation
        </h2>
        <p className="mb-8 text-lg text-gray-800">
          The Model Evaluation module provides a comprehensive analysis of your
          trained model's performance. Evaluate the model on training and
          testing datasets using metrics that are specific to your
          classification or regression task.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            1. Configuration Options
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-4">
              <strong>Select Train/Test Dataset:</strong> Choose the datasets
              used during training to evaluate the model's performance.
            </li>
            <li className="mb-4">
              <strong>Display Type:</strong> Decide how to view the evaluation
              results: as a table, or graph.
            </li>
            <li className="mb-4">
              <strong>Display Result:</strong> Choose whether to display results
              for all, only training, or only testing datasets.
            </li>
            <li>
              <strong>Filter Models:</strong> Apply filters to focus on specific
              models in the evaluation results.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            2. Steps to Evaluate a Model
          </h3>
          <ol className="list-decimal list-inside text-gray-700">
            <li className="mb-4">
              Select the dataset used for training and testing the model.
            </li>
            <li className="mb-4">
              Choose the desired display type (e.g., table or graph).
            </li>
            <li className="mb-4">
              Filter the models if you want to focus on specific ones.
            </li>
            <li>
              Click <strong>Submit</strong> to view the evaluation metrics.
            </li>
          </ol>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            3. Performance Metrics
          </h3>
          <p className="mb-6 text-gray-700">
            Evaluate your model's performance using metrics such as accuracy,
            precision, recall, F1-score (for classification), or R-squared and
            RMSE (for regression). Use these metrics to fine-tune your model or
            compare it with others.
          </p>
        </section>
      </div>
    ),
    modelPrediction: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">
          Model Prediction
        </h2>
        <p className="mb-8 text-lg text-gray-800">
          The Model Prediction module allows you to make predictions using a
          trained model on a selected dataset. This module supports both
          classification and regression tasks, automatically adjusting based on
          the model type.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            1. Configuration Options
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-4">
              <strong>Select Train/Test Dataset:</strong> Choose the dataset for
              making predictions.
            </li>
            <li className="mb-4">
              <strong>Select Model:</strong> Pick the model to use for
              predictions.
            </li>
            <li className="mb-4">
              <strong>Target Variable:</strong> Specify the target variable for
              predictions.
            </li>
            <li className="mb-4">
              <strong>Result Options:</strong> Based on the model type
              (classification or regression), select the desired result:
              <ul className="ml-6 list-disc">
                <li>
                  <strong>Classifier:</strong> Target Value, Accuracy,
                  Precision, Recall, F1-Score, Classification Report, Confusion
                  Matrix, Actual vs. Predicted, Precision-Recall Curve, ROC
                  Curve.
                </li>
                <li>
                  <strong>Regressor:</strong> Target Value, R-Squared, Mean
                  Absolute Error, Mean Squared Error, Root Mean Squared Error,
                  Regression Line Plot, Actual vs. Predicted, Residuals vs.
                  Predicted, Histogram of Residuals, QQ Plot, Box Plot of
                  Residuals.
                </li>
              </ul>
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            2. Steps to Make Predictions
          </h3>
          <ol className="list-decimal list-inside text-gray-700">
            <li className="mb-4">
              Select the dataset and trained model to use for predictions.
            </li>
            <li className="mb-4">
              Specify the target variable and desired result format.
            </li>
            <li>
              Click <strong>Show Result</strong> to generate and visualize
              predictions.
            </li>
          </ol>
        </section>

        <section>
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            3. Visualize Results
          </h3>
          <p className="mb-6 text-gray-700">
            Depending on the selected result type, view predictions as tables,
            plots, or metrics summaries. For example:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li>Confusion Matrix for classifiers.</li>
            <li>Regression Line Plot for regressors.</li>
            <li>
              Precision-Recall Curve or ROC Curve for evaluating classifier
              performance.
            </li>
          </ul>
        </section>
      </div>
    ),
    modelDeployment: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">
          Model Deployment
        </h2>
        <p className="mb-8 text-lg text-gray-800">
          The Model Deployment module allows you to test and deploy trained
          models with selected input values. It provides a user-friendly
          interface to evaluate predictions and validate the model's performance
          in real-world scenarios.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            1. Deployment Steps
          </h3>
          <ol className="list-decimal list-inside text-gray-700">
            <li className="mb-4">
              <strong>Select Model:</strong> Pick a trained model from the list,
              such as <code>KNN_Classification</code>, to use for predictions.
            </li>
            <li className="mb-4">
              <strong>Select Dataset:</strong> The related dataset is resolved
              automatically from the selected model.
            </li>
            <li className="mb-4">
              <strong>Select Columns:</strong> Specify the columns to be used
              for input by choosing <code>All Columns</code> or customizing the
              column selection.
            </li>
            <li>
              <strong>Input Values:</strong> Enter the required feature values
              (e.g.,
              <code>SepalLengthCm</code>, <code>SepalWidthCm</code>, etc.).
              These values are used as inputs for generating predictions.
            </li>
          </ol>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            2. Prediction Results
          </h3>
          <p className="mb-6 text-gray-700">
            Once the input values are provided, the model predicts the output,
            which is displayed on the right-hand side. For example:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>Species:</strong> The predicted class or label based on
              the provided inputs (e.g., <code>Setosa</code>,{" "}
              <code>Versicolor</code>).
            </li>
          </ul>
        </section>
      </div>
    ),
    reverseML: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">ReverseML</h2>
        <p className="mb-8 text-lg text-gray-800">
          The ReverseML module predicts feature values based on selected target
          variables, allowing reverse inference from target to features.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            How it Works
          </h3>
          <p className="text-gray-700">
            - Select features to predict values for. - Choose the target
            variables you want to base predictions on. - Provide input values
            for the target variable(s). - Click <strong>Predict</strong> to
            generate predictions for the selected features.
          </p>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Expectations
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li>At least one feature must be selected.</li>
            <li>At least one target variable must be defined.</li>
            <li>
              Provide valid input values for the chosen target variable(s).
            </li>
          </ul>
        </section>
      </div>
    ),
    invML: (
      <div className="space-y-6 p-6">
        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
          <h2 className="text-xl font-bold text-purple-800 mb-2">
            PSO Optimization (InvML)
          </h2>
          <p className="text-purple-700">
            Uses Particle Swarm Optimization to find optimal feature values that achieve your target prediction.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Required Inputs:</h3>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li><strong>Features:</strong> Select input variables to optimize</li>
            <li><strong>Target Column:</strong> What you want to predict</li>
            <li><strong>Target Value:</strong> Desired prediction value (single or multiple)</li>
            <li><strong>Feature Bounds:</strong> Min/max limits for each feature (auto-calculated from data)</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">PSO Parameters:</h3>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li><strong>Swarm Size:</strong> Number of particles (default: 50)</li>
            <li><strong>Max Iterations:</strong> Maximum optimization rounds (default: 100)</li>
            <li><strong>Omega (ω):</strong> Inertia weight (default: 0.5)</li>
            <li><strong>Phi P:</strong> Personal best influence (default: 0.5)</li>
            <li><strong>Phi G:</strong> Global best influence (default: 0.5)</li>
            <li><strong>Number of Solutions:</strong> How many solutions to find (default: 10)</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">What It Does:</h3>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Trains 4 models: Random Forest, Decision Tree, XGBoost, CatBoost</li>
            <li>Uses PSO to find feature combinations that predict your target value</li>
            <li>Evaluates each model's performance (R², MSE)</li>
            <li>Finds multiple solutions for each target value</li>
            <li>Ranks solutions by accuracy and model performance</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Results:</h3>
          <ul className="list-disc pl-6 space-y-1 text-gray-700">
            <li>Best model recommendation for each target value</li>
            <li>Optimized feature values that achieve target prediction</li>
            <li>Prediction accuracy and error metrics</li>
            <li>Interactive plots showing optimization convergence</li>
            <li>CSV download with all solutions</li>
          </ul>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
          <h4 className="font-semibold text-orange-800">How to Use Results:</h4>
          <p className="text-orange-700">
            Use the optimized feature values as input conditions to achieve your desired target prediction. 
            The system shows you exactly what feature combinations will give you the target outcome.
          </p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
          <h4 className="font-semibold text-yellow-800">Note:</h4>
          <p className="text-yellow-700">
            This is an inverse ML approach - instead of predicting outcomes from inputs, 
            it finds inputs that produce desired outcomes.
          </p>
        </div>
      </div>
    ),
    graphReformat: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">
          Graph Dataset Reformat
        </h2>
        <p className="mb-8 text-lg text-gray-800">
          This guide helps you reformat your graph data from a CSV file into
          separate files for nodes, edges, and targets. You can upload your CSV,
          and once the processing is done, you will receive a downloadable ZIP
          archive containing the reformatted graph data.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            1. CSV Requirements
          </h3>
          <p className="mb-4 text-gray-700">
            Make sure your CSV includes these essential columns:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <code>Bending-Modulus(q^-4)</code> — Target property of the graph.
            </li>
            <li>
              <code>Tail-Length-A</code> and <code>N-double-A</code> —
              Additional numeric features related to A.
            </li>
            <li>
              <code>Tail-Length-B</code> and <code>N-double-B</code> —
              Additional numeric features related to B.
            </li>
            <li>
              <code>Node-Features</code> — A list of{" "}
              <code>(node_id, node_type)</code>
              pairs in Python literal format (e.g.,{" "}
              <code>[("1","C"),("2","O")]</code>).
            </li>
            <li>
              <code>Edge-List</code> — A list of <code>(source, target)</code>{" "}
              pairs in Python literal format (e.g.,{" "}
              <code>[("1","2"),("2","3")]</code>).
            </li>
            <li>
              <code>Composition</code> — Unique identifier for the graph (e.g.{" "}
              <em>Graph ID</em>).
            </li>
          </ul>
          <p className="text-gray-700 mt-4">
            If any of these columns are missing, the reformatting will fail.
          </p>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            2. Reformat Steps
          </h3>
          <p className="mb-4 text-gray-700">
            When you upload your CSV, the system will:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-2">
              <strong>Parse your CSV</strong> — Ensure all columns exist and
              read in row data.
            </li>
            <li className="mb-2">
              <strong>Process each row</strong> — Convert the{" "}
              <code>Node-Features</code>
              and <code>Edge-List</code> from text into row-by-row structures.
            </li>
            <li className="mb-2">
              <strong>Create three CSV files</strong>:
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>
                  <code>nodes.csv</code> — Contains columns like{" "}
                  <code>graph_id</code>,<code>node_id</code>, and
                  one-hot-encoded <code>node_type</code>.
                </li>
                <li>
                  <code>edges.csv</code> — Contains columns like{" "}
                  <code>graph_id</code>,<code>source_node_id</code>, and{" "}
                  <code>target_node_id</code>.
                </li>
                <li>
                  <code>targets_graph.csv</code> — Records target values and
                  numeric features (<code>Bending-Modulus(q^-4)</code>,
                  <code>Tail-Length-A</code>, etc.).
                </li>
              </ul>
            </li>
            <li className="mb-2">
              <strong>Archive files</strong> — Packages these three CSVs into a
              single ZIP file.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            3. Download Results
          </h3>
          <p className="mb-4 text-gray-700">
            After processing, the system will generate a ZIP file:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>nodes.csv</strong> — List of nodes and one-hot-encoded
              node types.
            </li>
            <li>
              <strong>edges.csv</strong> — Source and target columns for each
              edge.
            </li>
            <li>
              <strong>targets_graph.csv</strong> — Numeric features and target
              values for each graph.
            </li>
          </ul>
          <p className="text-gray-700 mt-4">
            The <code>processed_data.zip</code> file will automatically download
            onto your device, ready to be extracted and utilized in further
            analysis or modeling.
          </p>
        </section>

        <section>
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            4. Tips & Best Practices
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li>
              Ensure <code>Node-Features</code> and <code>Edge-List</code>
              columns are valid Python literal lists (e.g.,{" "}
              <code>[("1","C"),("2","O")]</code>).
            </li>
            <li>
              Double-check unique graph identifiers in <code>Composition</code>.
            </li>
            <li>
              Use consistent naming for node IDs in <code>Node-Features</code>
              and <code>Edge-List</code>.
            </li>
          </ul>
        </section>
      </div>
    ),
    graphUploadDocs: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">
          Graph Data Upload & Processing
        </h2>
        <p className="mb-8 text-lg text-gray-800">
          This guide outlines the steps to upload and process graph data,
          including nodes, edges, and targets. After processing, you can
          download a PyTorch Geometric <code>.pt</code> file for further graph
          analysis.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            1. Required Inputs
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-2">
              <strong>Graph Model Name:</strong> A unique identifier for your
              graph model (used for saving and referencing the processed data).
            </li>
            <li className="mb-2">
              <strong>Nodes File:</strong> A CSV file containing node features
              (e.g., <code>node_id</code>, <code>graph_id</code>, plus
              additional one-hot or numeric columns).
            </li>
            <li className="mb-2">
              <strong>Edges File:</strong> A CSV file describing edge
              connections (e.g., <code>source_node_id</code>,{" "}
              <code>target_node_id</code>,<code>graph_id</code>, and optionally
              edge features).
            </li>
            <li>
              <strong>Targets File:</strong> A CSV file containing at least
              <code>graph_id</code> and <code>target</code>, plus any numeric
              graph-level features (e.g., <em>molecular properties</em>).
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            2. Upload Process
          </h3>
          <p className="mb-4 text-gray-700">
            Use the upload interface to select your files:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-2">
              Enter a <em>unique</em> graph model name in the text field.
            </li>
            <li className="mb-2">
              Choose the <strong>Node</strong>, <strong>Edge</strong>, and{" "}
              <strong>Target</strong> CSV files from your server file list.
            </li>
            <li className="mb-2">
              Click <strong>Process</strong> to send the files to the backend
              for validation and processing.
            </li>
          </ul>
          <p className="text-gray-700">
            If any file is invalid or columns are missing, you'll see an error
            message in a toast notification.
          </p>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            3. Backend Processing
          </h3>
          <p className="mb-4 text-gray-700">
            The backend converts your CSV files into a PyTorch Geometric
            <code>Data</code> object:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>Nodes CSV</strong>: Node IDs are mapped to node indices,
              and string boolean values (e.g. <code>TRUE</code>,{" "}
              <code>FALSE</code>) are converted to numeric (1, 0).
            </li>
            <li>
              <strong>Edges CSV</strong>: Source and target IDs are matched to
              the node index. Invalid or missing node references are skipped.
            </li>
            <li>
              <strong>Targets CSV</strong>: The <code>target</code> column is
              stored as <code>y</code>, and any additional columns as{" "}
              <code>graph_features</code>.
            </li>
          </ul>
          <p className="text-gray-700">
            Once processed, the data is serialized into <code>.pt</code> format,
            base64-encoded, and returned to the frontend for immediate download.
          </p>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            4. Download & Usage
          </h3>
          <p className="mb-4 text-gray-700">
            After successful processing, a “Download Graph” button will appear:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li>
              Click <strong>Download Graph</strong> to save the
              <code>.pt</code> file containing your processed data.
            </li>
            <li>
              You can load this file in any PyTorch Geometric script via
              <code>torch.load("your_graph_name.pt")</code>.
            </li>
          </ul>
          <p className="text-gray-700 mt-4">
            For best results, ensure your CSV files include valid numeric
            feature columns and properly matched IDs.
          </p>
        </section>
      </div>
    ),
    trainModelDocs: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">Train Model</h2>
        <p className="mb-8 text-lg text-gray-800">
          Use this interface to train a Graph Neural Network (GNN) on your
          uploaded graph data. Specify parameters such as the model type (
          <code>GCN</code>,<code>GAT</code>, or <code>GraphSAGE</code>), the
          number of epochs, and other hyperparameters. After training, you can
          visualize metrics and download the trained model file.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            1. Select Graph
          </h3>
          <p className="mb-4 text-gray-700">
            From the dropdown, choose a previously uploaded graph. The system
            fetches the graph’s PyTorch Geometric data from your IndexedDB
            storage for processing.
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li>
              <strong>Graph Name</strong> must be set in the
              <strong>Data Upload</strong> step.
            </li>
            <li>
              If the graph data is missing or invalid, an error will appear in
              the notification bar.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            2. Model Parameters
          </h3>
          <p className="mb-4 text-gray-700">
            Configure hyperparameters to customize the training procedure:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-2">
              <strong>Model Type:</strong> Choose from <code>GCN</code>,
              <code>GAT</code>, or <code>GraphSAGE</code>.
            </li>
            <li className="mb-2">
              <strong>Number of Epochs:</strong> How many training iterations to
              run.
            </li>
            <li className="mb-2">
              <strong>Learning Rate:</strong> Step size for gradient-based
              optimizers.
            </li>
            <li className="mb-2">
              <strong>Batch Size:</strong> Number of graphs in each mini-batch.
            </li>
            <li className="mb-2">
              <strong>Activation:</strong> Non-linear function (
              <code>ReLU</code>,<code>LeakyReLU</code>, <code>Sigmoid</code>, or{" "}
              <code>Tanh</code>).
            </li>
            <li className="mb-2">
              <strong>Dropout Rate:</strong> Probability of dropout during
              training to reduce overfitting.
            </li>
            <li className="mb-2">
              <strong>Hidden Channels &amp; Layers:</strong> Model complexity
              (number of channels per layer, and how many GNN layers).
            </li>
            <li className="mb-2">
              <strong>Heads (GAT only):</strong> Number of attention heads in
              Graph Attention Network.
            </li>
            <li>
              <strong>Test Size:</strong> Fraction of data used for testing (
              <code>0.2</code> by default).
            </li>
          </ul>
          <p className="text-gray-700 mt-4">
            After setting parameters, click <strong>Train Model</strong> to
            start training.
          </p>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            3. Training & Visualizations
          </h3>
          <p className="mb-4 text-gray-700">
            Once training begins, the system:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-2">
              <strong>Splits your data</strong> into training and test sets
              (according to <code>test_size</code>).
            </li>
            <li className="mb-2">
              <strong>Trains the GNN</strong> over the specified number of
              epochs, recording performance metrics each epoch.
            </li>
            <li className="mb-2">
              <strong>Saves performance plots</strong> — you’ll see real-time
              charts for <em>Loss</em>, <em>R²</em>, <em>MAE</em>, and{" "}
              <em>RMSE</em>
              across training and test sets.
            </li>
            <li>
              <strong>Displays final metrics</strong> for test set performance
              (e.g., final loss, R², MAE, RMSE).
            </li>
          </ul>
          <p className="text-gray-700 mt-4">
            A summary table (DataFrame) is shown, listing each epoch’s metrics
            to help analyze model convergence.
          </p>
        </section>

        <section>
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            4. Download Trained Model
          </h3>
          <p className="mb-4 text-gray-700">
            After training completes, you can download the serialized PyTorch
            model:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-2">
              Click <strong>Download Trained Model</strong> to get the{" "}
              <code>.pth</code> file containing model parameters.
            </li>
            <li className="mb-2">
              You can re-load this file in PyTorch to run inference or continue
              training in another environment.
            </li>
            <li>
              The model data and parameters are also stored in your browser’s
              IndexedDB under the chosen graph name.
            </li>
          </ul>
          <p className="text-gray-700 mt-4">
            With these steps, you can train a robust GNN model on your dataset
            and reuse the final model for predictions or further
            experimentation.
          </p>
        </section>
      </div>
    ),
    predictDocs: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">
          Model Prediction
        </h2>
        <p className="mb-8 text-lg text-gray-800">
          Use this interface to generate predictions from an already trained
          Graph Neural Network (GNN). After selecting a saved model and
          uploading new data (nodes, edges, and optionally targets), the system
          will run the model inference and display the prediction results.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            1. Select a Trained Model
          </h3>
          <p className="mb-4 text-gray-700">
            Choose from the dropdown of graph models that have trained
            parameters stored. These models come from the{" "}
            <strong>Train Model</strong> step, where they were saved in your
            browser’s IndexedDB.
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-2">
              Only models with <code>model_data</code> (the serialized PyTorch
              parameters) are displayed.
            </li>
            <li>
              Upon selecting a model, the page will confirm that the data loaded
              successfully.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            2. Prepare Input Files
          </h3>
          <p className="mb-4 text-gray-700">
            To run a prediction, you’ll need:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-2">
              <strong>Nodes File:</strong> A CSV with the same feature columns
              used during model training (e.g., <code>node_id</code>,{" "}
              <code>graph_id</code>, and the numeric feature columns).
            </li>
            <li className="mb-2">
              <strong>Edges File:</strong> A CSV describing edges between node
              IDs (matching those in the nodes file).
            </li>
            <li>
              <strong>Targets File (Optional):</strong> If you have ground-truth
              values, you can also upload them to compare predictions with true
              labels.
            </li>
          </ul>
          <p className="text-gray-700 mt-4">
            Each file is uploaded via a separate “Upload” button. Ensure they
            match the format and feature schema from training.
          </p>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            3. Make a Prediction
          </h3>
          <p className="mb-4 text-gray-700">
            Once the model and files are set:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-2">
              Click <strong>Predict</strong> to send the data to the backend for
              inference.
            </li>
            <li className="mb-2">
              The system processes your CSVs into PyTorch Geometric
              <code>Data</code> objects, loads the trained model, and runs
              forward passes on each graph.
            </li>
            <li>
              Any errors (e.g., missing columns, non-numeric features) will show
              in a toast notification.
            </li>
          </ul>
        </section>

        <section>
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            4. View and Analyze Results
          </h3>
          <p className="mb-4 text-gray-700">
            Successful predictions appear in a table below the “Predict” button:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li className="mb-2">
              Each row shows the <code>graph_id</code> and the predicted value.
            </li>
            <li className="mb-2">
              If you uploaded a <strong>Targets File</strong>, you can compare
              prediction vs. ground-truth.
            </li>
            <li>
              Predictions are also returned in a JSON-like structure, making it
              easy to reuse them downstream.
            </li>
          </ul>
          <p className="text-gray-700 mt-4">
            With this interface, you can seamlessly run inference on new or
            existing graphs, reusing the GNN models trained earlier.
          </p>
        </section>
      </div>
    ),
    smilesGeneration: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">SMILES Generation using AutoVAE</h2>
        <p className="mb-8 text-lg text-gray-800">
          The SMILES Generation module uses Variational Autoencoders (VAE) to generate novel molecular 
          SMILES strings with ring structures. It supports three different training configurations for 
          optimal molecule generation.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Training Modes
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li><strong>Train Full → Test Latent:</strong> Train on the full dataset, test on latent space projections</li>
            <li><strong>Train Latent → Test Latent:</strong> Both training and testing on latent space representations</li>
            <li><strong>Train Full → Test Full:</strong> Traditional full dataset training and testing</li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            How it Works
          </h3>
          <p className="text-gray-700 mb-4">
            The AutoVAE model processes SMILES strings through the following steps:
          </p>
          <ul className="list-disc list-inside text-gray-700">
            <li>Tokenizes SMILES strings into character sequences</li>
            <li>Trains an encoder-decoder architecture with LSTM layers</li>
            <li>Maps molecules to a continuous latent space</li>
            <li>Generates new molecules by sampling from the latent space</li>
            <li>Filters generated SMILES for validity and ring structures</li>
            <li>Provides molecular formulas and analysis for generated compounds</li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Configuration Parameters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-green-400 mb-2">VAE Architecture</h4>
              <ul className="list-disc list-inside text-gray-700 text-sm">
                <li><strong>Latent Dimension:</strong> Size of the latent space (32-256)</li>
                <li><strong>Embedding Dimension:</strong> Character embedding size (64-512)</li>
                <li><strong>LSTM Units:</strong> Number of LSTM hidden units (64-512)</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-green-400 mb-2">Training Parameters</h4>
              <ul className="list-disc list-inside text-gray-700 text-sm">
                <li><strong>Epochs:</strong> Number of training iterations (10-200)</li>
                <li><strong>Batch Size:</strong> Training batch size (16-256)</li>
                <li><strong>Learning Rate:</strong> Optimizer learning rate (0.0001-0.01)</li>
                <li><strong>Test Size:</strong> Validation split ratio (0.1-0.5)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Output and Analysis
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li><strong>Generated SMILES:</strong> Novel molecular structures with validity indicators</li>
            <li><strong>Molecular Formulas:</strong> Chemical formulas for generated compounds</li>
            <li><strong>Training Metrics:</strong> Loss curves and model performance visualization</li>
            <li><strong>Validity Analysis:</strong> Statistics on valid vs invalid generated molecules</li>
            <li><strong>Ring Structure Filter:</strong> Focus on molecules containing ring structures</li>
            <li><strong>Duplicate Analysis:</strong> Identification of unique vs duplicate generations</li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Requirements
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li>Dataset must contain a column with valid SMILES strings</li>
            <li>Optional epsilon column for additional molecular properties</li>
            <li>Minimum 100 SMILES for effective training</li>
            <li>SMILES should represent diverse molecular structures</li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Best Practices
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li>Start with lower epochs (50) for initial testing</li>
            <li>Use latent dimensions between 64-128 for most applications</li>
            <li>Increase batch size for larger datasets</li>
            <li>Monitor training metrics to avoid overfitting</li>
            <li>Validate generated SMILES using RDKit before chemical synthesis</li>
          </ul>        </section>
      </div>
    ),
    smilesIupac: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">SMILES to IUPAC Name</h2>
        <p className="mb-8 text-lg text-gray-800">
          Convert SMILES strings into standard IUPAC chemical names using PubChem database.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            How to Use
          </h3>
          <div className="bg-primary/5 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-primary-dark mb-2">Batch Mode</h4>
            <ol className="list-decimal list-inside text-primary-dark">
              <li>Select your SMILES column from the dataset</li>
              <li>Set batch size (default: 10)</li>
              <li>Set request delay (default: 0.2 seconds)</li>
              <li>Click "Convert to IUPAC"</li>
            </ol>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Individual Mode</h4>
            <ol className="list-decimal list-inside text-green-700">
              <li>Enter a single SMILES string (e.g., "CCO")</li>
              <li>Set request delay if needed</li>
              <li>Click "Convert"</li>
            </ol>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Settings
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li><strong>Batch Size:</strong> Number of SMILES to process at once (1-1000)</li>
            <li><strong>Request Delay:</strong> Delay between API calls (0.1-5.0 seconds)</li>
            <li><strong>Rate Limiting:</strong> Prevents PubChem API blocking</li>
          </ul>
        </section>

        <section>
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            What You Get
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li><strong>IUPAC Names:</strong> Standard chemical names for each SMILES</li>
            <li><strong>Success Statistics:</strong> Conversion success rate and failed entries</li>
            <li><strong>PubChem Data:</strong> Compound IDs and additional chemical information</li>
            <li><strong>CSV Download:</strong> Complete results with original data plus IUPAC names</li>
            <li><strong>Error Reports:</strong> List of invalid SMILES with explanations</li>
          </ul>
        </section>
      </div>
    ),
    smilesStructure: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">SMILES to Molecular Structure</h2>
        <p className="mb-8 text-lg text-gray-800">
          Convert SMILES strings into visual molecular structure diagrams using RDKit.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            How to Use
          </h3>
          <div className="bg-primary/5 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-primary-dark mb-2">Batch Mode</h4>
            <ol className="list-decimal list-inside text-primary-dark">
              <li>Select your SMILES column from the dataset</li>
              <li>Choose image size (default: 300px)</li>
              <li>Set format: PNG or SVG</li>
              <li>Click "Generate Structures"</li>
            </ol>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Individual Mode</h4>
            <ol className="list-decimal list-inside text-green-700">
              <li>Enter a single SMILES string (e.g., "CCO")</li>
              <li>Adjust image settings if needed</li>
              <li>Click "Generate Structure"</li>
            </ol>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Settings
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li><strong>Image Size:</strong> 100-1000px (default: 300px)</li>
            <li><strong>Format:</strong> PNG (photos) or SVG (scalable)</li>
            <li><strong>Max Images:</strong> Limit for large datasets</li>
          </ul>
        </section>

        <section>
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            What You Get
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li><strong>Preview Gallery:</strong> See first 6 structures instantly</li>
            <li><strong>Individual Images:</strong> Download each structure</li>
            <li><strong>Combined PDF:</strong> All structures in one file</li>
            <li><strong>Statistics:</strong> Success rate and processing info</li>
          </ul>
        </section>
      </div>
    ),
    smilesSAS: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">SMILES to Synthetic Accessibility Score (SAS)</h2>
        <p className="mb-8 text-lg text-gray-800">
          Calculate Synthetic Accessibility Scores for SMILES strings using RDKit's SA_Score algorithm. 
          SAS scores indicate how difficult it is to synthesize a molecule, ranging from 1 (easy) to 10 (very difficult).
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            How to Use
          </h3>
          <div className="bg-primary/5 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-primary-dark mb-2">Batch Mode</h4>
            <ol className="list-decimal list-inside text-primary-dark">
              <li>Upload a CSV file containing SMILES strings</li>
              <li>Select the column containing your SMILES data</li>
              <li>Click "CALCULATE BATCH SAS"</li>
              <li>View results and download data</li>
            </ol>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Individual Mode</h4>
            <ol className="list-decimal list-inside text-green-700">
              <li>Enter a single SMILES string (e.g., "CCO", "c1ccccc1")</li>
              <li>Click "CALCULATE SAS SCORE"</li>
              <li>View the SAS score and complexity level</li>
            </ol>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Understanding SAS Scores
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Low Complexity (1-3)</h4>
              <p className="text-green-700 text-sm">Simple, drug-like molecules that are easy to synthesize. Examples: ethanol (CCO), benzene (c1ccccc1)</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">Medium Complexity (4-6)</h4>
              <p className="text-yellow-700 text-sm">Moderate complexity requiring standard synthesis methods. Examples: functionalized aromatics, simple heterocycles</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2">High Complexity (7-10)</h4>
              <p className="text-red-700 text-sm">Complex molecules requiring advanced synthesis techniques. Examples: natural products, complex polycycles</p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            What You Get
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li><strong>Individual Results:</strong> SAS score, complexity level, and interpretation</li>
            <li><strong>Batch Results:</strong> Complete dataset with SAS scores for all molecules</li>
            <li><strong>Statistics:</strong> Total processed, success rate, failed calculations</li>
            <li><strong>Visualizations:</strong> Score distribution, complexity breakdown, and range analysis</li>
            <li><strong>Data Export:</strong> Download results as CSV with all calculated scores</li>
          </ul>
        </section>


      </div>
    ),
    smilesDft: (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="mb-6 text-3xl font-bold text-green-600">SMILES to DFT Calculator</h2>
        <p className="mb-8 text-lg text-gray-800">
          Calculate Density Functional Theory (DFT) properties for SMILES strings using Psi4 quantum chemistry software. 
          This tool computes electronic properties including HOMO, LUMO, energy gap, and total energy for molecular structures.
        </p>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            How to Use
          </h3>
          <div className="bg-primary/5 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-primary-dark mb-2">Batch Processing</h4>
            <ol className="list-decimal list-inside text-primary-dark">
              <li>Upload a CSV file containing SMILES strings</li>
              <li>Select the column containing your SMILES data</li>
              <li>Set the number of molecules to process (Top K)</li>
              <li>Click "CALCULATE DFT" to start processing</li>
              <li>Monitor progress and view results</li>
            </ol>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            DFT Properties Calculated
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary-dark mb-2">Electronic Properties</h4>
              <ul className="list-disc list-inside text-primary-dark text-sm">
                <li><strong>HOMO:</strong> Highest Occupied Molecular Orbital energy</li>
                <li><strong>LUMO:</strong> Lowest Unoccupied Molecular Orbital energy</li>
                <li><strong>Energy Gap:</strong> HOMO-LUMO gap (band gap)</li>
                <li><strong>Total Energy:</strong> Hartree-Fock total energy</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Processing Status</h4>
              <ul className="list-disc list-inside text-green-700 text-sm">
                <li><strong>Success Flag:</strong> Indicates if calculation completed</li>
                <li><strong>Error Messages:</strong> Details for failed calculations</li>
                <li><strong>Processing Time:</strong> Time taken for each molecule</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Configuration Options
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li><strong>Top K:</strong> Number of molecules to process from your dataset (default: all molecules)</li>
            <li><strong>SMILES Column:</strong> Select which column contains your molecular structures</li>
            <li><strong>Batch Processing:</strong> Handles large datasets efficiently with progress tracking</li>
            <li><strong>Error Handling:</strong> Continues processing even if some molecules fail</li>
          </ul>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Understanding Results
          </h3>
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Summary Statistics</h4>
              <ul className="list-disc list-inside text-yellow-700">
                <li><strong>Total Processed:</strong> Number of molecules attempted</li>
                <li><strong>Successful Calculations:</strong> Molecules with valid DFT results</li>
                <li><strong>Failed Calculations:</strong> Molecules that couldn't be processed</li>
                <li><strong>Success Rate:</strong> Percentage of successful calculations</li>
                <li><strong>Average Energy:</strong> Mean total energy across successful calculations</li>
                <li><strong>Average Gap:</strong> Mean HOMO-LUMO gap across successful calculations</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Detailed Results</h4>
              <p className="text-gray-700">
                Each row shows the original data plus calculated DFT properties. Failed calculations 
                will show "Not calculated" for DFT properties and include error details.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h3 className="mb-4 text-2xl font-semibold text-green-500">
            Technical Details
          </h3>
          <ul className="list-disc list-inside text-gray-700">
            <li><strong>Method:</strong> Hartree-Fock (HF) level of theory using Psi4</li>
            <li><strong>Basis Set:</strong> Standard basis set for molecular calculations</li>
            <li><strong>Geometry:</strong> Automatic 3D structure generation from SMILES</li>
            <li><strong>Convergence:</strong> Standard SCF convergence criteria</li>
            <li><strong>Processing:</strong> Sequential processing with error handling</li>
          </ul>
        </section>

      </div>
    ),
  };

  return content[section];
}

export default Docs;
