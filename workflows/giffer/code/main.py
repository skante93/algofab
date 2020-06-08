#!/usr/bin/env python3

import sys
import os
from PIL import Image


INPUT_FOLDER = "inputs"
OUTPUT_FOLDER = "/outputs"

if len(sys.argv) < 3 :
	raise Exception("The script is launch according to the following structure :\n\t./main.py <input> <outputs> [<duration>]")

input_src = INPUT_FOLDER+'/'+sys.argv[1]
output_src = OUTPUT_FOLDER+'/'+sys.argv[2]
duration=1000


if len(sys.argv) > 3 :
	duration = int(sys.argv[3])
	

# print("input_src: ", input_src)
# print("output_src: ", output_src)
# print("duration: ", duration)


images = [ Image.open(input_src+'/'+im) for im in os.listdir(input_src) ]


images[0].save(
	output_src,
    save_all=True, 
    append_images=images[1:], 
    optimize=False, 
    duration=duration, 
    loop=0
)