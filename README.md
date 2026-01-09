from pathlib import Path

content = """# 🌸 Java Florist

## 📌 Project Information
- **Supervisor:** Mr. Hoang Duc Quang  
- **Semester:** 3  
- **Batch:** T1.2406.E1  
- **Group:** 1  

## 👥 Group Members

| No | Name | Roll No |
|----|------|---------|
| 1 | Trần Trung Anh | Student1571996 |
| 2 | Đặng Quốc Khánh | Student1572003 |
| 3 | Lê Nguyễn Gia Huy | Student1571995 |
| 4 | Thân Thế Lộc | Student1571994 |
| 5 | Vũ Thị Hoài Thu | Student1571993 |

---

## 🌼 Introduction
Java Florist is a flower shop that provides fresh and beautiful flower arrangements.  
To expand its business, the shop develops a website for online flower ordering and delivery.

---

## 🌐 Main Features
- View and order flower bouquets  
- Register for customer accounts  
- Buy floral design books  
- Submit flower design ideas  
- Top designs are rewarded and shown on the homepage  

---

## 📂 Project Structure

Group1 - Java Florist
│
├── db → Database files (SQL, backup, data)
├── doc → Project documents and user guides
└── src → Application source code

---

## 🚀 How to Run
1. Import database from **db** folder  
2. Open project in **src** using NetBeans or IntelliJ  
3. Configure database connection  
4. Run the project  
"""

path = "/mnt/data/README.md"
Path(path).write_text(content, encoding="utf-8")
path
