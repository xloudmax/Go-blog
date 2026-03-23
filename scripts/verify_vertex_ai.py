import os
import vertexai
from vertexai.generative_models import GenerativeModel
from dotenv import load_dotenv

# 加载配置
# Try current dir first, then one level up, then specific ai_service/.env
if os.path.exists(".env"):
    load_dotenv(".env")
elif os.path.exists("../.env"):
    load_dotenv("../.env")
elif os.path.exists("ai_service/.env"):
    load_dotenv("ai_service/.env")
else:
    # Manual fallback if nothing else works
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", "ai_service", ".env"))

def verify_vertex_ai():
    # 获取环境变量
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "your-project-id")
    location = os.getenv("GOOGLE_CLOUD_REGION", "us-central1")
    model_name = os.getenv("LLM_MODEL", "gemini-2.0-flash-001")

    if project_id == "your-project-id":
        print("❌ 错误: 请先在 ai_service/.env 中设置有效的 GOOGLE_CLOUD_PROJECT")
        return

    print(f"正在连接 Vertex AI...")
    print(f"项目: {project_id}")
    print(f"区域: {location}")
    print(f"模型: {model_name}")

    try:
        # 1. 初始化 Vertex AI
        vertexai.init(project=project_id, location=location)

        # 2. 加载模型
        model = GenerativeModel(model_name)

        print("\n--- 发送测试请求 (Vertex AI 模式) ---")
        
        # 3. 生成内容
        response = model.generate_content(
            "Hello! You are running on Vertex AI. Please confirm your model version in one sentence."
        )
        
        print(f"\n✅ 验证通过！Vertex AI 回复：\n")
        print(response.text)
        print("\n-------------------")
        
    except Exception as e:
        print(f"\n❌ 连接失败!")
        print(f"错误详情: {str(e)}")
        
        if "DefaultCredentialsError" in str(e):
            print("\n💡 关键修复方案：")
            print("您需要先在本地进行 Google Cloud 鉴权。请在终端执行：")
            print("  gcloud auth application-default login")

if __name__ == "__main__":
    verify_vertex_ai()
