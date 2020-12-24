#!/usr/bin/env python3

import argparse
import csv
import yaml

def generateYMLfromCSV(csvFile, ymlFile):
  print("\n #####  Converting csv at {} to yml at {} #####\n".format(csvFile, ymlFile))
  with open(csvFile, mode='r',encoding='utf-8') as csv_file:
    lines = csv_file.readlines()
   
    english = dict()
    spanish  = dict()
    
    for obj in lines:
     
      
      try:
        en, es, key = obj.strip().strip("\n").split("$$")
        if key:
          category, subKey = key.split('.')
          if category not in english:
            english[category] = dict()
            spanish [category] = dict()
          english[category][subKey] = en
        spanish [category][subKey] = es

      except:
        continue
        
  f = open(ymlFile, 'w',encoding='utf-8')
  # print(english)
  f.write(yaml.dump({ "en": english, "es": spanish }, default_flow_style=False, allow_unicode=True))

def main(args):
  inputFile = args.input_csv_file
  outputFile = args.output_yml_file
  generateYMLfromCSV(inputFile, outputFile)

if __name__ == '__main__':
  parser = argparse.ArgumentParser(description=
  """convert csv file to yml file""")
  parser.add_argument('-input_csv_file', help='input csv', default = './src/translationSource/translationData.csv')
  parser.add_argument('-output_yml_file', help='output yml', default = './src/_data/translate.yml')
  args = parser.parse_args()
  main(args)