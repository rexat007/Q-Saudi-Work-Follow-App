"""Operator-only real-source extraction checks; no Google access or repository mutation."""
import argparse,json,hashlib,unittest,sys
sys.dont_write_bytecode=True
from pathlib import Path
from buildLocalWorkspaceBlueprint import extract,compact
ap=argparse.ArgumentParser();ap.add_argument('--xlsx',required=True);ap.add_argument('--asset',required=True);args=ap.parse_args()
class RealSourceChecks(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.before=hashlib.sha256(Path(args.xlsx).read_bytes()).hexdigest();cls.b,cls.report=extract(args.xlsx);cls.asset=json.loads(Path(args.asset).read_text())
 def test_source_is_owner_reference_and_unchanged(self):
  self.assertEqual(self.before,'7cdcf333cf24cf835c7d146ec63e3c1150d5b4629d0a86d15b2fa0f3fc7eb643');self.assertEqual(self.before,hashlib.sha256(Path(args.xlsx).read_bytes()).hexdigest())
 def test_source_structure_is_fully_accounted(self):
  self.assertEqual(self.report['sourceFormulaCells'],492);self.assertEqual(len(self.b['sheets']),7);self.assertEqual(sum(len(s.get('merges',[])) for s in self.b['sheets']),17);self.assertEqual(sum(len(s.get('conditionalFormats',[])) for s in self.b['sheets']),7)
 def test_sanitization_is_by_ownership(self):
  self.assertEqual(len(self.report['removedCells']),62);self.assertIn('Carrier Report Viewer!A11',self.report['removedCells']);self.assertIn('Dashboard!U5',self.report['removedCells']);self.assertIn('Loading Register!Q2',self.report['removedCells']);self.assertNotIn('Dashboard!A5',self.report['removedCells'])
 def test_compiled_asset_is_exact_reproducible_extraction(self):
  self.assertEqual(compact(json.loads(json.dumps(self.b))),self.asset)
 def test_formula_normalization_preserves_capacity_and_clean_guards(self):
  rows=self.b['sheets'][0]['data'][0]['rowData'];self.assertEqual(rows[297]['values'][19]['userEnteredValue']['formulaValue'],'=S298-R298');self.assertIn('O2:S2',rows[1]['values'][20]['userEnteredValue']['formulaValue']);self.assertNotIn('_xlfn.',json.dumps(self.b))
unittest.main(argv=['verifyLocalWorkspaceBlueprint'],verbosity=2)
