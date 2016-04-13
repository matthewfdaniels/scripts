# Polygraph's Film Dialogue Dataset

04/12/2016 - just pushed a major update of roughly 200 films based on reader feedback. We also decided to remove several datasets that provided additional metadata that wasn't published in the article. :(

Note: I am correcting the csv data as people find errors in our character mapping or omitted characters. Sorry if you end up forking an old data set.

A previous version presented the data as "lines." This turned out to be a very ambiguous word. In reality, we had compiled total number of words, by character, and then converted them to lines using an average of 10 words per line. This is creating more confusion than needed, so we're moving back to just words, which is what is currently in the CSV data to begin with. The minute-by-minute data, however, is still based on lines (i.e., a row of dialogue text).

character_list5.csv - this is the data that powers all of the calculations on polygraph.cool/films. It uses the most accurate script that we can find for a given film. People are understandably finding errors, so we will be updating this file as much as possible.

meta_data7.csv - this is unique list of IMDB_IDs from the character_list file, with additional meta data, such as release year and domestic, inflation-adjusted gross.

The selected scripts and their sources are also publicly maintained here: https://docs.google.com/spreadsheets/d/1fbcldxxyRvHjDaaY0EeQnQzvSP7Ub8QYVM2bIs-tKH8/edit#gid=1668340193

