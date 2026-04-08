import csv
import random
import os
import math

def generate_dataset(filename="trustops_panasonic_dataset.csv", rows=100000):
    headers = [
        "Network_Latency_ms", 
        "Network_Jitter_ms",
        "Packet_Loss_Pct",
        "CPU_Load_Pct", 
        "Memory_Usage_MB",
        "Admin_Interaction_Count", 
        "Power_Freq_Hz",
        "Voltage_Ripple_mV",
        "Sensor_Humidity_Pct",
        "Temp_Delta_C",
        "Showroom_Hours_Elapsed",
        "Anomaly_Context", 
        "Time_to_Failure_mins", 
        "Recommended_Action"
    ]
    
    data = []
    
    # Pre-calculate base values for stability
    for i in range(rows):
        # Patterns: Nominal (0.6), IoT-23 Security (0.2), Panasonic Operational (0.15), Extreme Anomaly (0.05)
        pattern = random.choices(['Nominal', 'IoT-23 Security', 'Panasonic Operational', 'Extreme Anomaly'], 
                                  weights=[0.6, 0.2, 0.15, 0.05])[0]
        
        # Default Jitter (Gaussian noise)
        def nj(mu, sigma): return max(0.01, random.gauss(mu, sigma))

        if pattern == 'Nominal':
            lat = nj(22, 5)
            jit = nj(2, 1)
            ploss = nj(0.01, 0.005)
            cpu = nj(15, 4)
            mem = nj(1200, 50)
            admin = 0
            pfreq = nj(50.0, 0.02)
            vrip = nj(12, 2)
            humid = nj(45, 2)
            temp = nj(1.2, 0.3)
            context = 'System Healthy'
            ttf = 9999
            action = 'None'
            
        elif pattern == 'IoT-23 Security':
            # Signatures of scanning/botnets
            lat = nj(450, 150)
            jit = nj(45, 15)
            ploss = nj(1.5, 0.8)
            cpu = nj(55, 12)
            mem = nj(2800, 400)
            admin = random.randint(8, 25) # High admin density
            pfreq = nj(50.0, 0.05)
            vrip = nj(15, 5)
            humid = nj(46, 5)
            temp = nj(4.5, 1.5)
            context = random.choice(["IoT-23: Mirai Scanning", "IoT-23: C&C Heartbeat Hijack", "IoT-23: Brute Force Entry"])
            ttf = random.randint(10, 45)
            action = 'Isolate Gateway & Reset Admin Credentials'
            
        elif pattern == 'Panasonic Operational':
            # Hardware drift/wear
            lat = nj(85, 20)
            jit = nj(8, 3)
            ploss = nj(0.1, 0.05)
            cpu = nj(82, 15)
            mem = nj(1800, 200)
            admin = random.randint(1, 4)
            pfreq = nj(49.2, 0.4) # Frequency droop
            vrip = nj(45, 15) # High ripple
            humid = nj(75, 10) # Environmental stress
            temp = nj(12, 4) # Thermal stress
            context = random.choice(["Panasonic: Phase L3 Instability", "Panasonic: Optical Calibration Drift", "Panasonic: Heat Sink Failure"])
            ttf = random.randint(120, 720)
            action = 'Scheduled Hardware Maintenance (Sector B)'
            
        else: # Extreme Anomaly
            lat = nj(2500, 500)
            jit = nj(200, 50)
            ploss = nj(18, 5)
            cpu = nj(98, 2)
            mem = nj(3900, 100)
            admin = random.randint(1, 10)
            pfreq = nj(47.5, 1.5)
            vrip = nj(120, 30)
            humid = nj(90, 5)
            temp = nj(28, 6)
            context = 'Critical Systemic Fault (Cascading)'
            ttf = random.randint(1, 15)
            action = 'Emergency System E-Stop & Physical Inspection'

        data.append([
            lat, jit, ploss, cpu, mem, admin, pfreq, vrip, humid, temp, 
            random.randint(0, 1000), # Showroom Hours
            context, ttf, action
        ])
        
    os.makedirs(os.path.dirname(os.path.abspath(filename)), exist_ok=True)
    
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(data)
        
    print(f"Successfully generated {rows} INDUSTRIAL-GRADE logs at {filename}")

if __name__ == "__main__":
    generate_dataset("trustops_panasonic_dataset.csv")
