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
        # Normal (0.55), Security-IoT-23 (0.3), Panasonic-Industrial (0.15)
        pattern = random.choices(['Nominal', 'IoT-23 Security Event', 'Panasonic Hardware Desync'], weights=[0.55, 0.3, 0.15])[0]
        
        if pattern == 'Nominal':
            latency = 20 + random.uniform(-2, 2)
            cpu = 15 + random.uniform(-3, 3)
            admin = 0
            context = 'System Healthy'
            ttf = 9999
            action = 'None'
            
        elif pattern == 'IoT-23 Security Event':
            # Signatures of IoT botnets
            latency = 300 + random.uniform(50, 200)
            cpu = 40 + random.uniform(10, 30)
            admin = random.randint(5, 20)
            context = random.choice([
                "IoT-23: Botnet Command & Control",
                "IoT-23: Mirai Horizontal Scanning",
                "IoT-23: Remote Console Hijack"
            ])
            ttf = random.randint(5, 30)
            action = 'Isolate External Gateway & Roll API Keys'
            
        else: # Panasonic Hardware Desync
            latency = 80 + random.uniform(10, 40)
            cpu = 70 + random.uniform(5, 20)
            admin = random.randint(1, 3)
            context = random.choice([
                "Panasonic: PLC Memory Corruption",
                "Panasonic: Sensor Noise Threshold Error",
                "Panasonic: Actuator Desync Fault"
            ])
            ttf = random.randint(60, 480)
            
            if 'Memory' in context:
                action = 'Re-flash Controller Firmware & Reset Sequence'
            else:
                action = 'Recalibrate Acoustic Sensor Array'
                
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
