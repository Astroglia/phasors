from scipy.misc import derivative
from scipy.signal import find_peaks
from scipy.stats import norm
import numpy as np
import math
import sys


# uses the first mathematical definition on wikipedia (https://en.wikipedia.org/wiki/Phase_(waves)) to give phase.
# restricts to input range. so phase_restriction should be like, 180 , or something.
def est_phase(x, T0, period, phase_restriction):
    est = abs(((x - T0) / period) * 360)
    while est > phase_restriction:
        est = est % phase_restriction
    return est

#similar to zero predictions. difference between peaks is period.
def oscillatory_peak_predictions():
    local_fields = sys.argv[1]
    mean = np.mean(local_fields)
    local_fields = local_fields - mean
    peaks, _ = find_peaks(local_fields, height=0, width=10)

    periods = []
    for i in range(len(peaks)):
        if i == 0:
            periods.append(peaks[i])
        else:
            periods.append(peaks[i] - peaks[i - 1] )
    periods = np.array(periods)
    mean_period = np.mean(periods)

    phase_est_arr = []
    curr_range = local_fields[0:peaks[0]]
    for i in range(len(peaks)):
        for j in range(len(curr_range)):
            phase_est_arr.append(est_phase(j, peaks[i], periods[i], 180))

        if i < (len(peaks) - 1):
            curr_range = local_fields[peaks[i]:peaks[i+1]]
        else: #at end - for loop will not iterate anymore!!
            curr_range = local_fields[peaks[i]:local_fields.shape[0]]
            for k in range(len(curr_range)):
                phase_est_arr.append( est_phase(k, peaks[i], periods[i], 180) )
    print(phase_est_arr)
    
    if __name__ == '__main__':
        oscillatory_peak_predictions()

