import pandas as pd
import openai
from dotenv import load_dotenv
import os
# Load environment variables
load_dotenv()

file_path = os.getenv("CSV_FILE_PATH")
api_key = os.getenv("OPENAI_API_KEY")

MY_SKILLSET = [
  "React",
  "React.js",
  "React Native",
  "Node.js",
  "Prisma ORMs",
  "ORM",
  "Docker",
  "Kubernetes",
  "AWS",
  "Amazon",
  "GCP",
  "Azure",
  "Next.js",
  "Python",
  "SQL",
  "Database",
  "Custom API",
  "DevOps",
  "Cloud Computing",
  "CRM",
  "ERP",
  "Salesforce",
  "Microsoft Dynamics",
  "Microsoft D365",
  "Power BI",
  "Flutter",
  "Shopify",
  "Raspberry Pi",
  "Machine Learning",
  "Data Science",
  "Data Analytics",
  "MLOps",
  "Natural Language Processing",
  "Computer Vision",
  "Artificial Neural Networks",
  "Generative AI",
  "Agentic AI",
  "AI Agent",
  "Bot",
  "LangChain",
  "Pytorch",
  "ERPNext",
  "Odoo"
]

if not api_key:
    raise ValueError("Error: OPENAI_API_KEY not found in environment variables or .env file.")
openai.api_key = api_key

def read_csv_file(file_path):
    try:
        df = pd.read_csv(file_path)
        return df
    except FileNotFoundError:
        print(f"Error: CSV file not found at {file_path}.")
        return None
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return None
    
def generate_proposal(job_data):
    title = job_data["title"]
    # client_spent = job_data["clientSpent"]
    # estimated_budget = job_data["estimatedBudget"]
    job_description = job_data["jobDescription"]
    # payment_verified = job_data["paymentVerified"]

    greeting = "Hi there,"
    introduction = "I'm Raymond Reddington, a freelance developer with several years of experience delivering high-quality web solutions."
    sign_off = "Looking forward to hearing from you.\n\nBest regards,\nRaymond Reddington"
    prompt = f"""
You are an expert freelance proposal writer. Write the core body of professional, and client-centered proposal for a freelance job.
Details:
Title: {title}
Job Summary: {job_description}...
Freelancer's skill set: {MY_SKILLSET}
Past works and projects: 
Global Fair - cloud based computer vision solution that helps them identify vendors of desired wood patterns out of a 32k strong SKU list
Wright Research - custom technology architecture and management for their end to end investment platform and internal operational tools
Paterson Securities - AI based solution to attract GenZ customers
TIGC - end to end platform development and management. ecom, stores, supply chain, analytics, dashboarding, product management
Snuckworks Platforms - GenAI solution to automate compliance reports
Fonepay - end to end security, technology review and upgrade for Nepal's largest fintech company
Centre of Development of Advanced Computing - skill building for big data, AI, analytics
[Need to confirm the name] partnered with a Series A-funded hyper-local grocery delivery startup to revamp their technology and operations—implementing ITIL processes, optimizing architecture, and improving quality control—which led to a 17% faster delivery time, 23% fewer bugs, and complete technical debt clearance in 3 months.
[Need to confirm Name] collaborated with a global contract formulation company—serving clients like Unilever and P&G—to develop a custom cloud-based solution that streamlined formulation tracking, integrated machine learning for optimal raw material selection, and enhanced workflow approvals, resulting in a 92% reduction in raw material selection errors, a 6% drop in customer complaints, and a 12% improvement in turnaround time within two months of deployment.
[Need to confirm Name]collaborated with a global intelligence and technology solutions provider to develop a custom AI-powered platform that streamlined third-party risk assessments by integrating four AI models across multiple cloud services, resulting in automated, human-like reports with minimal input and sustained relevance over time.
[Need to confirm Name] conducted a comprehensive technology audit for a leading fintech company processing over 1 million transactions every 15 hours, identifying critical issues in their complex tech stack—including multiple databases, microservices, and third-party integrations—and provided actionable recommendations on architecture, scalability, security, and disaster recovery, aligning with the company's strategic growth roadmap.
Point to consider while writing proposal:
1. A relevant past project or experience make very specific to job title.
2. How our skills align with this specific job keep very precise and specific to job description.
3. One thoughtful question showing genuine interest in the project.
Do not include greetings, introductions, or sign-offs—only the core body. Keep it conversational, professional, and about 200 words at max 2 paragraph.
"""
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional freelancer skilled in writing tailored job proposals."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7,
            top_p=0.9
        )
        middle_section = response.choices[0].message.content.strip()
        # Combine sections
        full_proposal = f"{greeting}\n\n{introduction}\n\n{middle_section}\n\n{sign_off}"
        return full_proposal
    except Exception as e:
        print(f"Error generating proposal with OpenAI: {e}")
        return None
def main():
    df = read_csv_file(file_path)
    if df is None:
        return
    # Initialize proposal column with empty strings
    df["proposal"] = ""
    for idx, row in df.iterrows():
        if row["matchesSkills"] == "Yes":
            print(f"Generating proposal for row {idx} - {row['title']}")
            proposal = generate_proposal(row)
            df.at[idx, "proposal"] = proposal if proposal else "Error generating proposal"
    try:
        df.to_csv(file_path, index=False)
        print(f"\nAll proposals generated")
    except Exception as e:
        print(f"Error saving CSV: {e}")
if __name__ == "__main__":
    main()