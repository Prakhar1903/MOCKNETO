import re

with open("src/Pages/VideoInterview.jsx", "r") as f:
    content = f.read()

# 1. Add credentials: "include" to fetch calls
content = content.replace(
    'body: JSON.stringify(payload),\n      });',
    'body: JSON.stringify(payload),\n        credentials: "include",\n      });'
)
content = content.replace(
    '...({ count: 5 } : {}),\n        }),\n      });',
    '...({ count: 5 } : {}),\n        }),\n        credentials: "include",\n      });'
)
# Re-do with regex to be safer
content = re.sub(
    r'(fetch\([^,]+,\s*\{.*?body:.*?\n\s+)(\}\);)',
    r'\1  credentials: "include",\n      \2',
    content,
    flags=re.DOTALL
)

with open("src/Pages/VideoInterview.jsx", "w") as f:
    f.write(content)
