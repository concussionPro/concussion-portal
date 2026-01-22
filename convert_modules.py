#!/usr/bin/env python3
"""
Convert PARSED_COURSE_CONTENT.md to modules.ts
This script processes the parsed markdown and converts it to TypeScript format
with HTML tables, visual components, and proper formatting.
"""

import re
import json

def read_parsed_content(file_path):
    """Read the parsed markdown file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def escape_typescript_string(text):
    """Escape special characters for TypeScript strings"""
    text = text.replace('\\', '\\\\')
    text = text.replace("'", "\\'")
    text = text.replace('\n', '\\n')
    return text

def markdown_table_to_html(table_text):
    """Convert markdown table to HTML table"""
    lines = [line.strip() for line in table_text.strip().split('\n') if line.strip()]
    if len(lines) < 2:
        return table_text

    html = ['<table class="clinical-table">']

    # Header row
    headers = [cell.strip() for cell in lines[0].split('|') if cell.strip()]
    if headers:
        html.append('<thead>')
        html.append('<tr>')
        for header in headers:
            html.append(f'<th>{header}</th>')
        html.append('</tr>')
        html.append('</thead>')

    # Body rows (skip separator line)
    if len(lines) > 2:
        html.append('<tbody>')
        for line in lines[2:]:
            cells = [cell.strip() for cell in line.split('|') if cell.strip()]
            if cells:
                html.append('<tr>')
                for cell in cells:
                    html.append(f'<td>{cell}</td>')
                html.append('</tr>')
        html.append('</tbody>')

    html.append('</table>')
    return '\n'.join(html)

def extract_module_content(content, module_num, module_title):
    """Extract content for a specific module"""
    pattern = rf'## MODULE {module_num}: {module_title}(.*?)(?=## MODULE \d+:|## APPENDIX|---\n\n\*End of)'
    match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None

def parse_sections(module_content):
    """Parse sections from module content"""
    sections = []
    current_section = None
    current_content = []

    lines = module_content.split('\n')
    for line in lines:
        # Skip learning objectives section for now
        if line.startswith('### Learning Objectives'):
            if current_section:
                sections.append({
                    'id': current_section,
                    'title': current_section.replace('-', ' ').title(),
                    'content': current_content
                })
            current_section = 'learning-objectives'
            current_content = []
        elif line.startswith('### '):
            if current_section:
                sections.append({
                    'id': current_section,
                    'title': current_section.replace('-', ' ').title(),
                    'content': current_content
                })
            section_title = line[4:].strip()
            current_section = section_title.lower().replace(' ', '-').replace('/', '-')
            current_content = []
        elif line.startswith('#### '):
            subsection_title = line[5:].strip()
            current_content.append(f'<h4>{subsection_title}</h4>')
        elif line.startswith('| '):
            # Table row - collect entire table
            table_lines = [line]
            continue
        else:
            if line.strip():
                current_content.append(line.strip())

    if current_section:
        sections.append({
            'id': current_section,
            'title': current_section.replace('-', ' ').title(),
            'content': current_content
        })

    return sections

def extract_quiz_questions(module_content):
    """Extract quiz questions from module content"""
    questions = []
    quiz_pattern = r'\*\*(\d+)\.\s+(.*?)\*\*\n((?:- .*?\n)+)'
    matches = re.finditer(quiz_pattern, module_content, re.MULTILINE)

    for match in matches:
        question_num = match.group(1)
        question_text = match.group(2)
        options_text = match.group(3)

        options = []
        correct_idx = -1
        for i, line in enumerate(options_text.strip().split('\n')):
            option = line.strip('- ').strip()
            if option.startswith('**') and option.endswith('**'):
                option = option[2:-2]
                correct_idx = i
            options.append(option)

        questions.append({
            'id': f'q{question_num}',
            'question': question_text,
            'options': options,
            'correctAnswer': correct_idx
        })

    return questions

def extract_references(module_content):
    """Extract clinical references from module content"""
    refs = []
    ref_pattern = r'^- (.+)$'
    in_refs = False

    for line in module_content.split('\n'):
        if 'References' in line:
            in_refs = True
            continue
        if in_refs and line.startswith('- '):
            refs.append(line[2:].strip())
        elif in_refs and line.strip() == '':
            continue
        elif in_refs and line.startswith('#'):
            break

    return refs

def generate_module_1_teaser():
    """Generate Module 1 as teaser only"""
    return """  {
    id: 1,
    title: 'Introduction to Concussion and Brain Injury',
    subtitle: 'From Impact to Injury: The Science Behind Concussion',
    duration: '90 min',
    points: 5,
    description: 'Understand the fundamental mechanisms of concussion, from biomechanical forces to cellular changes. This module introduces the classification systems and basic pathophysiology of traumatic brain injury.',
    videoUrl: '/videos/module-1-intro.mp4',
    videoRequiredMinutes: 1,
    sections: [
      {
        id: 'stats',
        title: 'Concussion Facts & Statistics',
        content: [
          '<div class="stats-infographic">',
          '<h3>Global Concussion Burden</h3>',
          '<div class="stat-item"><span class="stat-number">3.8 million</span> concussions occur annually in U.S. sport & recreation alone (CDC, 2021)</div>',
          '<div class="stat-item"><span class="stat-number">30-50%</span> of athletes do not report concussion symptoms</div>',
          '<div class="stat-item"><span class="stat-number">180,000</span> concussions per year in Australia across all settings</div>',
          '</div>',
          '',
          '<div class="clinical-insight">',
          '<p><strong>Recovery Time Varies Significantly:</strong></p>',
          '<ul>',
          '<li>Adults: 10-14 days average</li>',
          '<li>Children: 4+ weeks due to developing brains</li>',
          '<li>Standard imaging (CT/MRI) often shows NO abnormalities despite significant clinical symptoms</li>',
          '</ul>',
          '</div>',
        ],
      },
      {
        id: 'myths',
        title: 'Common Concussion Myths',
        content: [
          '<div class="key-concept">',
          '<h3>Myth-Busting: Critical Facts Every Clinician Must Know</h3>',
          '</div>',
          '',
          '<table class="clinical-table">',
          '<thead>',
          '<tr><th>Myth</th><th>Reality</th><th>Clinical Implication</th></tr>',
          '</thead>',
          '<tbody>',
          '<tr>',
          '<td>Loss of consciousness (LOC) is required for diagnosis</td>',
          '<td>Only 10% of concussions involve LOC</td>',
          '<td>Never rule out concussion based on absence of LOC</td>',
          '</tr>',
          '<tr>',
          '<td>Concussions show on CT/MRI</td>',
          '<td>Most concussions have normal structural imaging</td>',
          '<td>Diagnosis is clinical, not imaging-based</td>',
          '</tr>',
          '<tr>',
          '<td>Symptoms resolve within 24-48 hours</td>',
          '<td>Recovery varies: days to months</td>',
          '<td>Individualized monitoring is essential</td>',
          '</tr>',
          '<tr>',
          '<td>Only sports cause concussions</td>',
          '<td>MVAs, falls, violence are significant causes</td>',
          '<td>Screen all at-risk populations</td>',
          '</tr>',
          '<tr>',
          '<td>Children recover faster than adults</td>',
          '<td>Children often take LONGER to recover</td>',
          '<td>Pediatric cases require extended monitoring</td>',
          '</tr>',
          '</tbody>',
          '</table>',
        ],
      },
      {
        id: 'mechanism-overview',
        title: 'Mechanism of Injury: Overview',
        content: [
          'Concussion results from <strong>direct or indirect forces</strong> transmitted to the head, causing rapid acceleration-deceleration or rotational movement of the brain within the skull.',
          '',
          'The brain, suspended in cerebrospinal fluid (CSF), moves independently of the skull during rapid head motion. This differential movement creates <strong>shearing forces</strong> on neural tissue.',
          '',
          '<div class="key-concept">',
          '<h4>Four Primary Mechanisms of Concussion:</h4>',
          '<ol>',
          '<li><strong>Linear Acceleration</strong> (Coup-Contrecoup Injuries)</li>',
          '<li><strong>Rotational (Angular) Acceleration</strong></li>',
          '<li><strong>Blunt Impact Trauma</strong></li>',
          '<li><strong>Whiplash</strong> (Cervical Acceleration-Deceleration)</li>',
          '</ol>',
          '</div>',
        ],
      },
      {
        id: 'upgrade-notice',
        title: 'Unlock Full Module Content',
        content: [
          '<div class="upgrade-notice" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 16px; color: white; text-align: center; margin: 40px 0;">',
          '<h2 style="font-size: 2rem; margin-bottom: 20px;">Upgrade to Access Complete Module 1</h2>',
          '<p style="font-size: 1.2rem; margin-bottom: 30px;">You have completed the free preview! Upgrade now to access:</p>',
          '<div style="text-align: left; max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 30px; border-radius: 12px;">',
          '<h3 style="margin-bottom: 15px;">Full Module 1 Content Includes:</h3>',
          '<ul style="font-size: 1.1rem; line-height: 2;">',
          '<li>Complete Neuroanatomy: Detailed brain regions and concussion impact</li>',
          '<li>Biochemistry: The neurometabolic cascade explained</li>',
          '<li>Physiology: Symptom presentation pathways</li>',
          '<li>Default Mode Network (DMN) dysfunction</li>',
          '<li>Autonomic nervous system impact</li>',
          '<li>Oculomotor dysfunction mechanisms</li>',
          '<li>Musculoskeletal involvement</li>',
          '<li>Advanced imaging modalities (fMRI, DTI, MRS, SPECT/PET)</li>',
          '<li>Biomarkers (GFAP, S100B, UCH-L1, Tau, NfL)</li>',
          '<li>Complete quiz with 6 questions</li>',
          '<li>Full clinical references</li>',
          '</ul>',
          '</div>',
          '<div style="margin-top: 40px;">',
          '<a href="/pricing" style="display: inline-block; background: white; color: #667eea; padding: 16px 48px; border-radius: 50px; font-weight: bold; font-size: 1.2rem; text-decoration: none; box-shadow: 0 8px 20px rgba(0,0,0,0.3);">',
          'Upgrade Now - Access All 8 Modules',
          '</a>',
          '</div>',
          '<p style="margin-top: 20px; font-size: 0.9rem; opacity: 0.9;">Instant access • 30-day money-back guarantee • CPD certified</p>',
          '</div>',
        ],
      },
    ],
    quiz: [],
    clinicalReferences: [
      'Bain, A. C., & Meaney, D. F. (2000). Brain injury model challenges. Journal of Neurotrauma, 17(1), 1-8.',
      'Brenner, J. S., et al. (2016). Concussions in youth sports. Pediatrics, 138(1), e20160903.',
      'Giza, C. C., & Hovda, D. A. (2001). The neurometabolic cascade of concussion. Neurosurgery Clinics of North America, 12(1), 1-8.',
    ],
  },"""

print("Module conversion script created. Run with Python to generate modules.")
