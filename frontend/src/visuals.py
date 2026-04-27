import pandas as pd
from weasyprint import HTML

# Data preparation
data = {
    "Position": (
        ["Attacking"] * 8 + 
        ["Midfield"] * 8 + 
        ["Defensive"] * 8 + 
        ["Goalkeeper"] * 6
    ),
    "Statistic": [
        "Expected Goals (xG) per 90", "Non-Penalty Goals (NPG) per 90", "Expected Assists (xA) per 90", "Goal-Creating Actions (GCA)", "Progressive Carries (PCarries) per 90", "Successful Dribbles (%) per 90", "Shots on Target Rate (%) per 90", "Touches in the Opponent's Box per 90",
        "Expected Assists (xA) per 90", "Key Passes per 90", "Pass Completion Rate (%)", "Progressive Passes (PPasses) per 90", "Tackles Won (%)", "Successful Pressures (%)", "Interceptions per 90", "Miscontrols and Dispossessed per 90",
        "Aerial Duel Success Rate (%)", "Defensive Actions (DA) in Final Third per 90", "Ball Recoveries per 90", "Progressive Passing Distance (PPD) per 90", "Long Pass Completion Rate (%)", "Blocks (Shots/Passes) per 90", "Tackles/Interceptions Attempted per 90", "Clearances per 90",
        "PSxG-GA per 90", "Save Percentage", "Crosses Stopped (%)", "Launch Completion Rate (%)", "Passes Completed Short/Medium (%)", "DAOTB per 90"
    ],
    "Category": [
        "Goal Threat", "Goal Output", "Creation", "Creation", "Progression", "Efficiency", "Efficiency", "Positioning",
        "Creation", "Creation", "Retention", "Progression", "Defense", "Defense", "Defense", "Ball Security",
        "Physicality", "Positioning", "Possession", "Progression", "Build-up", "Reliability", "Activity", "Clearance",
        "Shot-Stopping", "Shot-Stopping", "Command", "Distribution", "Distribution", "Sweeper"
    ],
    "Reason for Inclusion": [
        "Measures the quality and volume of shots taken (primary indicator).", "Measures open-play scoring efficiency.", "Measures the quality of chances created for teammates.", "Measures offensive actions directly leading to a goal.", "Measures direct, forward movement of the ball.", "Measures flair and close control effectiveness.", "Measures shot accuracy relative to attempts.", "Measures presence in high-danger scoring zones.",
        "Measures passing quality leading to shot opportunities.", "Passes that directly lead to a shot by a teammate.", "Measures ball security in the midfield third.", "Measures volume of line-breaking passes.", "Measures efficiency in regaining possession.", "Measures pressure effectiveness within five seconds.", "Measures reading the game and breaking up attacks.", "Measures loss of possession under pressure (negative factor).",
        "Measures dominance in air battles (crucial for CBs).", "Measures proactive defending higher up the pitch.", "Measures how quickly a player wins back loose balls.", "Measures ground gained through passing (ball-playing CBs).", "Measures accuracy in launching attacks from the back.", "Measures body positioning and blocking ability.", "Measures the volume of defensive engagement.", "Measures effective removal of danger from the box.",
        "Compares expected goals faced (after the shot) to goals conceded.", "Traditional baseline of goalkeeper effectiveness.", "Ability to proactively claim or punch crosses.", "Accuracy of goal kicks and long throws.", "Accuracy in initiating build-up play from the back.", "Proactive positioning to clear danger outside the box."
    ]
}

df = pd.DataFrame(data)

# HTML template with CSS for a high-quality print-ready table
html_content = f"""
<!DOCTYPE html>
<html>
<head>
<style>
    @page {{
        size: A4;
        margin: 10mm;
        background-color: #0f172a;
    }}
    body {{
        font-family: 'Inter', -apple-system, sans-serif;
        color: #f1f5f9;
        margin: 0;
        padding: 0;
        background-color: #0f172a;
    }}
    .container {{
        width: 100%;
    }}
    .header {{
        padding: 20px;
        background: linear-gradient(90deg, #1e293b 0%, #0f172a 100%);
        border-bottom: 1px solid #334155;
        margin-bottom: 20px;
    }}
    h1 {{
        font-size: 18pt;
        margin: 0;
        color: #38bdf8;
        letter-spacing: -0.025em;
    }}
    table {{
        width: 100%;
        border-collapse: collapse;
        font-size: 9pt;
        background-color: #1e293b;
        border-radius: 8px;
        overflow: hidden;
    }}
    th {{
        background-color: #334155;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        text-align: left;
        padding: 12px 15px;
        border-bottom: 2px solid #0f172a;
    }}
    td {{
        padding: 10px 15px;
        border-bottom: 1px solid #334155;
        line-height: 1.4;
    }}
    .pos-tag {{
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 8pt;
        color: white;
    }}
    .Attacking {{ background-color: #ef4444; }}
    .Midfield {{ background-color: #3b82f6; }}
    .Defensive {{ background-color: #10b981; }}
    .Goalkeeper {{ background-color: #f59e0b; }}
    
    tr:nth-child(even) {{
        background-color: #1e293b;
    }}
    tr:nth-child(odd) {{
        background-color: #1a2233;
    }}
    .category-cell {{
        color: #38bdf8;
        font-weight: 500;
    }}
</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MVPA Positional Performance Metrics Matrix</h1>
        </div>
        <table>
            <thead>
                <tr>
                    <th style="width: 15%;">Position</th>
                    <th style="width: 25%;">Statistic</th>
                    <th style="width: 15%;">Category</th>
                    <th style="width: 45%;">Reason for Inclusion</th>
                </tr>
            </thead>
            <tbody>
                {"".join([f'''
                <tr>
                    <td><span class="pos-tag {row["Position"]}">{row["Position"]}</span></td>
                    <td style="font-weight: bold;">{row["Statistic"]}</td>
                    <td class="category-cell">{row["Category"]}</td>
                    <td>{row["Reason for Inclusion"]}</td>
                </tr>
                ''' for _, row in df.iterrows()])}
            </tbody>
        </table>
    </div>
</body>
</html>
"""

# Output paths
html_path = "positional_metrics_table.html"

# Just write the HTML file
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Success! Open {html_path} in your browser and 'Print to PDF'.")