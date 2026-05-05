import os
from PIL import Image, ImageDraw, ImageFont

# Configuration
c = {
    'bg_color': '#18181B',  # Dark Gray
    'text_color': '#FFFFFF', # White
    'font_size': 40,
    'width_service': 600,
    'height_service': 800,
    'width_hero': 1200,
    'height_hero': 800
}

# Ensure images directory exists
if not os.path.exists('images'):
    os.makedirs('images')

def create_placeholder(filename, text, width, height):
    img = Image.new('RGB', (width, height), color=c['bg_color'])
    d = ImageDraw.Draw(img)
    
    # Try to load a font, fallback to default
    try:
        font = ImageFont.truetype("arial.ttf", c['font_size'])
    except IOError:
        font = ImageFont.load_default()

    # Calculate text position (centered) - simple approximation
    bbox = d.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (width - text_width) / 2
    y = (height - text_height) / 2
    
    d.text((x, y), text, fill=c['text_color'], font=font)
    
    # Add a border
    d.rectangle([0, 0, width-1, height-1], outline=c['text_color'], width=2)
    
    path = os.path.join('images', filename)
    img.save(path)
    print(f"Created {path}")

# List of assets to generate
assets = [
    ('hero_visual.png', 'Amarufighter Hero Visual', c['width_hero'], c['height_hero']),
    ('service_kickboxing.png', 'Kick Boxing', c['width_service'], c['height_service']),
    ('service_jiujitsu.png', 'Jiu Jitsu', c['width_service'], c['height_service']),
    ('service_mma.png', 'MMA', c['width_service'], c['height_service']),
    ('service_group.png', 'Group Training', c['width_service'], c['height_service']),
    ('service_personal.png', 'Personal Training', c['width_service'], c['height_service']),
    ('service_community.png', 'Community', c['width_service'], c['height_service']),
]

for filename, text, w, h in assets:
    if not os.path.exists(os.path.join('images', filename)):
        create_placeholder(filename, text, w, h)
    else:
        print(f"Skipping {filename}, already exists.")

print("Asset generation complete.")
