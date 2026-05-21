import json
import re
urlofde = input("Url đề : ")
idexam = input("Số hiệu đề:")
with open(urlofde, 'r') as file:
    raw_data = file.read()
def convert_to_final_json(input_text, id_exam, filename="quiz_data.json"):
    lines = [line.strip() for line in input_text.strip().split('\n') if line.strip()]
    data = []
    i = 0

    while i < len(lines):
        line = lines[i]
        

        if line.startswith("[TLN]"):
            try:
                item = {
                    "type": "tln",
                    "label": line.replace("[TLN]", "").strip(),
                    "ans": lines[i+1],
                    "reasons": lines[i+2] if i+2 < len(lines) else "Chưa có giải thích"
                }
                data.append(item)
                i += 3 
            except IndexError:
                break
        elif line.startswith("[DS]") or line.startswith("[DS2018]"):
            q_type = "ds" if line.startswith("[DS]") else "ds2018"
            label = line.replace("[DS]", "").replace("[DS2018]", "").strip()
            try:
                item = {
                    "type": q_type,
                    "label": label,
                    "options": [lines[i+1], lines[i+2], lines[i+3], lines[i+4]],
                    "ans": lines[i+5],
                    "reasons": lines[i+6] if i+6 < len(lines) else "Chưa có giải thích"
                }
                data.append(item)
                i += 7
            except IndexError: break
        # 2. Xử lý câu trắc nghiệm [TEXT] hoặc [IMAGE] - Quy ước 6 dòng
        elif line.startswith("[TEXT]") or line.startswith("[IMAGE]"):
            q_type = "text" if line.startswith("[TEXT]") else "image"
            label = line.replace("[TEXT]", "").replace("[IMAGE]", "").strip()
            
            try:
                item = {
                    "type": q_type,
                    "label": label,
                    "ans": lines[i+1],
                    "ans_w": [
                        {"label": lines[i+2]},
                        {"label": lines[i+3]},
                        {"label": lines[i+4]}
                    ],
                    "reasons": lines[i+5] if i+5 < len(lines) else "Chưa có giải thích"
                }
                data.append(item)
                i += 6 
            except IndexError:
                break
        else:
            i += 1

    result = {
        "tende": "Đề thi nâng cao",
        "idexam": str(id_exam),
        "data": data
    }

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    return result
raw_data = """
"""

json_output = convert_to_final_json(raw_data,idexam)
print(json_output)