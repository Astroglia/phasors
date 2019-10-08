import numpy as np
import h5py
from scipy import signal
import sys

def main():

    local_fields = []
    image_path = sys.argv[1]
    with h5py.File(image_path, 'r') as f:
        local_fields = list(f['zorinData'])
    local_fields = np.array(local_fields)

    local_fields = local_fields[0, 0:8000] ##TODO change when done
    Fs = float(sys.argv[2])
    lower_band = 7/(.5*Fs) #Todo bring in lower/upper/Fs from user.
    upper_band = 25/(.5*Fs)
    bands = [ lower_band, upper_band ]

    b_bandpass, a_bandpass = signal.butter(5 , [ lower_band, upper_band ], btype="band") 

    filtered_data = signal.lfilter(b_bandpass, a_bandpass, local_fields)  # filter TODO: signal is phase shifted from lfilter.
    filtered_data = filtered_data.astype(float)
    x_axis = np.arange(0, filtered_data.shape[0], 1/Fs)
    final_data = [filtered_data, x_axis]

    ##array length output is limited to 3288, so incrementally send output to javascript.
    print(list(filtered_data))

if __name__ == '__main__':
    main()