"""
Quality Assurance Tools for CrewAI Multi-Agent System
Production-ready validation and quality checking tools
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel


class CompletenessValidatorTool(BaseModel):
    """Tool to validate completeness of preferences"""
    
    name: str = "completeness_validator"
    description: str = "Validates if all required preference fields are present"
    
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate preference completeness
        
        Args:
            inputs: {"preferences": dict}
            
        Returns:
            {"is_complete": bool, "missing_fields": list, "score": float}
        """
        try:
            prefs = inputs.get("preferences", {})
            
            # Required fields
            required_fields = {
                "service_type": prefs.get("service_type"),
                "budget": prefs.get("budget_min") or prefs.get("budget_max"),
                "time_urgency": prefs.get("time_urgency")
            }
            
            # Optional field
            optional_fields = {
                "artisan_preference": prefs.get("artisan_preference")
            }
            
            # Find missing required fields
            missing = [field for field, value in required_fields.items() if value is None]
            
            # Calculate score (0-1)
            total_fields = len(required_fields) + len(optional_fields)
            filled_required = sum(1 for v in required_fields.values() if v is not None)
            filled_optional = sum(1 for v in optional_fields.values() if v is not None)
            score = (filled_required + filled_optional) / total_fields
            
            return {
                "is_complete": len(missing) == 0,
                "missing_fields": missing,
                "score": round(score, 2)
            }
            
        except Exception as e:
            print(f"CompletenessValidatorTool error: {e}")
            return {
                "is_complete": False,
                "missing_fields": ["service_type", "budget", "time_urgency"],
                "score": 0.0
            }


class BusinessRuleCheckerTool(BaseModel):
    """Tool to check business rules compliance"""
    
    name: str = "business_rule_checker"
    description: str = "Checks if preferences comply with business rules"
    
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check business rules
        
        Args:
            inputs: {"preferences": dict, "business_rules": dict}
            
        Returns:
            {"compliant": bool, "violations": list, "warnings": list}
        """
        try:
            prefs = inputs.get("preferences", {})
            violations = []
            warnings = []
            
            # Rule 1: budget_max must be > 0
            budget_max = prefs.get("budget_max")
            if budget_max is not None:
                if budget_max <= 0:
                    violations.append("Budget must be greater than $0")
                elif budget_max < 10:
                    warnings.append("Budget seems very low (under $10)")
            
            # Rule 2: budget_max must be < 1000
            if budget_max is not None and budget_max > 1000:
                violations.append("Budget exceeds maximum allowed ($1000)")
            
            # Rule 3: time_urgency must be valid
            valid_urgencies = ["ASAP", "today", "week", "flexible"]
            time_urgency = prefs.get("time_urgency")
            if time_urgency and time_urgency not in valid_urgencies:
                violations.append(f"Invalid time urgency: {time_urgency}")
            
            # Rule 4: service_type must be valid
            valid_services = ["haircut", "nails", "massage", "spa", "facial", "waxing", "makeup", "cleaning"]
            service_type = prefs.get("service_type")
            if service_type and service_type not in valid_services:
                warnings.append(f"Unusual service type: {service_type}")
            
            # Rule 5: budget_min should be <= budget_max
            budget_min = prefs.get("budget_min")
            if budget_min and budget_max and budget_min > budget_max:
                violations.append("Minimum budget cannot exceed maximum budget")
            
            return {
                "compliant": len(violations) == 0,
                "violations": violations,
                "warnings": warnings
            }
            
        except Exception as e:
            print(f"BusinessRuleCheckerTool error: {e}")
            return {
                "compliant": True,
                "violations": [],
                "warnings": []
            }


class DataQualityScorerTool(BaseModel):
    """Tool to calculate overall data quality score"""
    
    name: str = "data_quality_scorer"
    description: str = "Calculates quality score (0-100) for preference data"
    
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate data quality score
        
        Args:
            inputs: {"preferences": dict}
            
        Returns:
            {"quality_score": float, "issues": list}
        """
        try:
            prefs = inputs.get("preferences", {})
            score = 100
            issues = []
            
            # Completeness (30 points max)
            required_fields = ["service_type", "budget_max", "time_urgency"]
            missing_required = [f for f in required_fields if not prefs.get(f)]
            score -= len(missing_required) * 10
            if missing_required:
                issues.append(f"Missing required fields: {', '.join(missing_required)}")
            
            # Compliance (40 points max)
            budget_max = prefs.get("budget_max")
            if budget_max:
                if budget_max <= 0:
                    score -= 20
                    issues.append("Invalid budget: must be positive")
                elif budget_max > 1000:
                    score -= 10
                    issues.append("Budget exceeds recommended maximum")
            
            # Consistency (20 points max)
            budget_min = prefs.get("budget_min")
            if budget_min and budget_max and budget_min > budget_max:
                score -= 20
                issues.append("Budget range is inconsistent")
            
            # Specificity (10 points max)
            if not prefs.get("artisan_preference"):
                score -= 5
                issues.append("No provider preference specified (optional)")
            
            return {
                "quality_score": max(0, score),
                "issues": issues
            }
            
        except Exception as e:
            print(f"DataQualityScorerTool error: {e}")
            return {
                "quality_score": 0,
                "issues": ["Error calculating quality score"]
            }


class AnomalyDetectorTool(BaseModel):
    """Tool to detect anomalies in preference data"""
    
    name: str = "anomaly_detector"
    description: str = "Detects suspicious or anomalous patterns in preferences"
    
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detect anomalies
        
        Args:
            inputs: {"current_data": dict, "historical_patterns": list}
            
        Returns:
            {"is_anomaly": bool, "risk_level": str, "reason": str}
        """
        try:
            data = inputs.get("current_data", {})
            
            # Check for suspicious patterns
            budget_max = data.get("budget_max")
            
            # Anomaly 1: Budget too low
            if budget_max is not None and budget_max < 5:
                return {
                    "is_anomaly": True,
                    "risk_level": "high",
                    "reason": "Budget is suspiciously low (under $5)"
                }
            
            # Anomaly 2: Budget extremely high
            if budget_max is not None and budget_max > 500:
                return {
                    "is_anomaly": True,
                    "risk_level": "medium",
                    "reason": "Budget is unusually high (over $500)"
                }
            
            # Anomaly 3: No service type specified
            if not data.get("service_type"):
                return {
                    "is_anomaly": False,
                    "risk_level": "low",
                    "reason": "Service type not yet specified (normal in early conversation)"
                }
            
            # No anomalies detected
            return {
                "is_anomaly": False,
                "risk_level": "low",
                "reason": "Data appears normal"
            }
            
        except Exception as e:
            print(f"AnomalyDetectorTool error: {e}")
            return {
                "is_anomaly": False,
                "risk_level": "low",
                "reason": "Unable to detect anomalies"
            }


class ValidationReportTool(BaseModel):
    """Tool to generate comprehensive validation report"""
    
    name: str = "validation_report"
    description: str = "Generates comprehensive validation report from all checks"
    
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate validation report
        
        Args:
            inputs: {"all_validations": dict}
            
        Returns:
            {"passed": bool, "score": float, "issues": list, "recommendations": list}
        """
        try:
            validations = inputs.get("all_validations", {})
            
            # Aggregate results
            completeness = validations.get("completeness", {})
            compliance = validations.get("compliance", {})
            quality = validations.get("quality", {})
            anomaly = validations.get("anomaly", {})
            
            # Collect all issues
            issues = []
            if completeness.get("missing_fields"):
                issues.extend([f"Missing: {f}" for f in completeness["missing_fields"]])
            if compliance.get("violations"):
                issues.extend(compliance["violations"])
            if quality.get("issues"):
                issues.extend(quality["issues"])
            if anomaly.get("is_anomaly"):
                issues.append(f"Anomaly detected: {anomaly.get('reason')}")
            
            # Generate recommendations
            recommendations = []
            if completeness.get("missing_fields"):
                for field in completeness["missing_fields"]:
                    if field == "service_type":
                        recommendations.append("Please specify what service you're looking for")
                    elif field == "budget":
                        recommendations.append("Please provide your budget range")
                    elif field == "time_urgency":
                        recommendations.append("Please let us know when you need this")
            
            if compliance.get("violations"):
                recommendations.append("Please review and fix the validation errors")
            
            # Overall pass/fail
            passed = (
                completeness.get("is_complete", False) and
                compliance.get("compliant", True) and
                not anomaly.get("is_anomaly", False)
            )
            
            # Overall score
            score = quality.get("quality_score", 0)
            
            return {
                "passed": passed,
                "score": score,
                "issues": issues,
                "recommendations": recommendations
            }
            
        except Exception as e:
            print(f"ValidationReportTool error: {e}")
            return {
                "passed": False,
                "score": 0,
                "issues": ["Error generating validation report"],
                "recommendations": ["Please try again"]
            }


# Tool instances
completeness_validator_tool = CompletenessValidatorTool()
business_rule_checker_tool = BusinessRuleCheckerTool()
data_quality_scorer_tool = DataQualityScorerTool()
anomaly_detector_tool = AnomalyDetectorTool()
validation_report_tool = ValidationReportTool()



