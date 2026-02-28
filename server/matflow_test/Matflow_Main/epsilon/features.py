# This file contains the various functions needed to calculate the features utilized for training and predictions

import numpy as np

from rdkit import Chem
from rdkit.Chem.MolStandardize import rdMolStandardize
import rdkit.Chem.Descriptors

def LoadDescriptorsBuiltIntoRdkit():
    result = dict()
    
    for name in dir(rdkit.Chem.Descriptors):
        if (name.startswith('Chi') or name.startswith('fr_') or name.startswith('Num') or name.startswith('Mol') or 'Count' in name or 'Max' in name or 'Min' in name):

            function = getattr(rdkit.Chem.Descriptors, name)
            if (callable(function)):
                result[name] = function
                
    return result
            
            
rdkitDescriptors = LoadDescriptorsBuiltIntoRdkit()

customPatternsToMatch = dict()
customPatternsToMatch['SO3'] = Chem.MolFromSmarts('S(=O)(=O)[O-]')
customPatternsToMatch['COOH'] = Chem.MolFromSmarts('C(=O)O')
customPatternsToMatch['CH3'] = Chem.MolFromSmarts('[CH3]')

from collections import Counter

def ComputeAtomCounts(molecule):
    result = dict(Counter(atom.GetSymbol() for atom in molecule.GetAtoms()))
    totalHeavy = sum(result.values())
    
    result['Total'] = molecule.GetNumAtoms(onlyExplicit = False)
    result['H'] = result['Total'] - totalHeavy
    
    return result


def ComputeLongestCarbonChain(molecule):
    carbonChain = ''
    while True:
        carbonChain += 'C'
        match = molecule.GetSubstructMatch(Chem.MolFromSmarts(carbonChain))
        if (len(match) == 0):
            return len(carbonChain) - 1
        

def ComputePatternCount(molecule, pattern):
    return len(molecule.GetSubstructMatches(pattern))


def FindLongestConjugationBondChain(molecule):
    Chem.SanitizeMol(molecule, catchErrors=True) 
    supplier = Chem.ResonanceMolSupplier(molecule)
    conjugatedBondsList = [[] for i in range(supplier.GetNumConjGrps() + 1)]

    for bond in molecule.GetBonds():
        if (bond.GetIsConjugated() == True):
            conjugatedBondIndex = molecule.GetBondBetweenAtoms(bond.GetBeginAtomIdx(), bond.GetEndAtomIdx()).GetIdx()

            conjugatedBondsList[supplier.GetBondConjGrpIdx(conjugatedBondIndex)].append(conjugatedBondIndex)

    conjugatedBondsList.sort(key = len, reverse = True)

    result = conjugatedBondsList[0]
    
    if (len(result) == 0):
        return None

    result = Chem.PathToSubmol(molecule, result, atomMap = {})
    Chem.SanitizeMol(result, catchErrors = True)

    return result


def ComputeMaxDistance(molecule):
    if (len(Chem.GetMolFrags(molecule)) > 1):
        uncharger = rdMolStandardize.Uncharger()
        molecule = uncharger.uncharge(rdMolStandardize.FragmentParent(molecule))
    
    Chem.rdDepictor.Compute2DCoords(molecule)
    
    distances = Chem.GetDistanceMatrix(molecule)

    if (len(distances) == 0):
        return 0

    return np.max(distances)


def ComputeFeaturesFor(molecule):
    result = dict()
    
    for key, value in ComputeAtomCounts(molecule).items():
        result[key + ' Atom Count'] = value
        
    result['Longest Carbon Chain'] = ComputeLongestCarbonChain(molecule)
    result['Aromatic Atom Count'] = len(molecule.GetAromaticAtoms())
    result['Conformers Count'] = molecule.GetNumConformers()
    result['Max Distance'] = ComputeMaxDistance(molecule)
    result['Bonds Count']  = len(molecule.GetBonds())
    
    for name, function in rdkitDescriptors.items():
        result['Rdkit Descriptor ' + name] = function(molecule)
        
    for name, pattern in customPatternsToMatch.items():
        result[name + ' Pattern Count'] = ComputePatternCount(molecule, pattern)
        
    return result
    

def ComputeAllFeaturesUnsafe(smiles):
    molecule = Chem.MolFromSmiles(smiles)

    result = ComputeFeaturesFor(molecule)

    result['InchiKey'] = Chem.inchi.MolToInchiKey(molecule)

    bondChain = FindLongestConjugationBondChain(molecule)

    if ((bondChain is None) == False):
        bondResults = ComputeFeaturesFor(bondChain)

        for key, value in bondResults.items():
            result['Bond Chain-' + key] = value

    return result
    

def ComputeAllFeatures(smiles):
    try:
        try:
            return ComputeAllFeaturesUnsafe(smiles)
        except:
            smiles = Chem.MolToSmiles(Chem.MolFromSmiles(smiles), isomericSmiles = False)

            return ComputeAllFeaturesUnsafe(smiles)

    except Exception as e:
        print('Error with ' + str(smiles))
        print(e)
        return {'Error': True}