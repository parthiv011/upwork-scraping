import sys
import json
from process import generate_proposal  # import your function

if __name__ == "__main__":
    try:
        job_data = json.loads(sys.argv[1])
        proposal = generate_proposal(job_data)
        print(proposal)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
