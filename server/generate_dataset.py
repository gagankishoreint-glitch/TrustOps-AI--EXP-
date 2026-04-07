import csv
import random
import os

def generate_dataset(filename="trustops_panasonic_dataset.csv", rows=1000):
    headers = [
        "Timestamp_Offset", 
        "Network_Latency_ms", 
        "CPU_Load_Pct", 
        "Admin_Interaction_Count", 
        "Degradation_Pattern", 
        "Anomaly_Context", 
        "Time_to_Failure_mins", 
        "Recommended_Action"
    ]
    
    data = []
    
    for i in range(rows):
        # Base distributions
        pattern = random.choices(['Nominal', 'Slow Decay', 'Rapid Fail'], weights=[0.6, 0.25, 0.15])[0]
        
        if pattern == 'Nominal':
            latency = int(random.gauss(40, 15))
            latency = max(5, latency)
            cpu = int(random.gauss(30, 10))
            cpu = max(5, min(80, cpu))
            admin = random.randint(0, 2)
            context = 'System Healthy'
            ttf = 9999
            action = 'None'
            
        elif pattern == 'Slow Decay':
            latency = int(random.gauss(150, 40))
            cpu = int(random.gauss(65, 15))
            cpu = min(95, cpu)
            admin = random.randint(1, 4)
            context = random.choice(['Operational Friction', 'Network Saturation'])
            ttf = random.randint(45, 120)
            
            if context == 'Operational Friction':
                action = 'Schedule Display Controller Diagnostic'
            else:
                action = 'Throttle Non-Critical CDN Bandwidth'
                
        else: # Rapid Fail
            latency = int(random.gauss(800, 250))
            cpu = int(random.gauss(90, 8))
            cpu = min(100, cpu)
            admin = random.randint(4, 15)
            context = random.choice(['Unauthorized Access', 'Severe Hardware Fault'])
            ttf = random.randint(2, 15)
            
            if context == 'Unauthorized Access':
                action = 'Lock Admin Console & Revert Overrides'
            else:
                action = 'Restart Display Controller & Isolate Node'
                
        data.append([
            i * 60, # Simulated seconds offset
            latency,
            cpu,
            admin,
            pattern,
            context,
            ttf,
            action
        ])
        
    os.makedirs(os.path.dirname(os.path.abspath(filename)), exist_ok=True)
    
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(data)
        
    print(f"Successfully generated {rows} synthetic logs at {filename}")

if __name__ == "__main__":
    generate_dataset("../trustops_panasonic_dataset.csv")
