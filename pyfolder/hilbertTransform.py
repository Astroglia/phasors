import numpy as np
from scipy import signal
import sys
import json

def main():
    data = sys.argv[1]
    data = data.split(',')
    def float_cast(item):
        try:
            return float(item)
        except ValueError:
            return 0
    filtered_data = [float_cast(item) for item in data]
    filtered_data = np.array(filtered_data, dtype=np.float32)
    where_are_NaNs = np.isnan(filtered_data)
    filtered_data[where_are_NaNs] = 0
    analytic_signal = signal.hilbert(filtered_data)
    instantaneous_phase = np.unwrap(np.angle(analytic_signal))
    instantaneous_phase = instantaneous_phase % 180  # move to 180 degrees range.
    print(list(instantaneous_phase))
    
if __name__ == '__main__':
    main()