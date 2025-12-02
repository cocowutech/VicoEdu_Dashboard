"""
Conversation Tools for CrewAI Multi-Agent System
Production-ready tools with Pydantic validation
"""

import re
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


# Convert word numbers to digits in time context
# Word to number mapping for hours (1-12 for am/pm)
time_word_to_num = {
    'zero': '0',
    'one': '1',
    'two': '2',
    'three': '3', 
    'four': '4', 
    'five': '5', 
    'six': '6',
    'seven': '7', 
    'eight': '8', 
    'nine': '9', 
    'ten': '10',
    'eleven': '11',
    'twelve': '12',
    'thirteen': '13',
    'fourteen': '14',
    'fifteen': '15',
    'sixteen': '16',
    'seventeen': '17',
    'eighteen': '18',
    'nineteen': '19',
    'twenty': '20',
    'twenty-one': '21',
    'twenty-two': '22',
    'twenty-three': '23',
    'twenty-four': '24',
    'twenty-five': '25',
    'twenty-six': '26',
    'twenty-seven': '27',
    'twenty-eight': '28',
    'twenty-nine': '29',
    'thirty': '30',
    'thirty-one': '31',
    'thirty-two': '32',
    'thirty-three': '33',
    'thirty-four': '34',
    'thirty-five': '35',
    'thirty-six': '36',
    'thirty-seven': '37',
    'thirty-eight': '38',
    'thirty-nine': '39',
    'forty': '40',
    'forty-one': '41',
    'forty-two': '42',
    'forty-three': '43',
    'forty-four': '44',
    'forty-five': '45',
    'forty-six': '46',
    'forty-seven': '47',
    'forty-eight': '48',
    'forty-nine': '49',
    'fifty': '50',
    'fifty-one': '51',
    'fifty-two': '52',
    'fifty-three': '53',
    'fifty-four': '54',
    'fifty-five': '55',
    'fifty-six': '56',
    'fifty-seven': '57',
    'fifty-eight': '58',
    'fifty-nine': '59',
    'sixty': '60',
    'sixty-one': '61',
    'sixty-two': '62',
    'sixty-three': '63',
    'sixty-four': '64',
    'sixty-five': '65',
    'sixty-six': '66',
    'sixty-seven': '67',
    'sixty-eight': '68',
    'sixty-nine': '69',
    'seventy': '70',
    'seventy-one': '71',
    'seventy-two': '72',
    'seventy-three': '73',
    'seventy-four': '74',
    'seventy-five': '75',
    'seventy-six': '76',
    'seventy-seven': '77',
    'seventy-eight': '78',
    'seventy-nine': '79',
    'eighty': '80',
    'eighty-one': '81',
    'eighty-two': '82',
    'eighty-three': '83',
    'eighty-four': '84',
    'eighty-five': '85',
    'eighty-six': '86',
    'eighty-seven': '87',
    'eighty-eight': '88',
    'eighty-nine': '89',
    'ninety': '90',
    'ninety-one': '91',
    'ninety-two': '92',
    'ninety-three': '93',
    'ninety-four': '94',
    'ninety-five': '95',
    'ninety-six': '96',
    'ninety-seven': '97',
    'ninety-eight': '98',
    'ninety-nine': '99',
    'hundred': '100',
    'thousand': '1000',
}


# First, handle compound time expressions like "five thirty pm" -> "5:30 pm"
# Pattern: [hour word] [minute word] [am/pm]
minute_words = {
    'oh five': '05', 'o five': '05', 'five': '05',
    'ten': '10',
    'fifteen': '15',
    'twenty': '20',
    'thirty': '30',
    'forty': '40',
    'forty-five': '45', 
    'fifty': '50',
    'zero': '00',
    'hundred': '00'
}

numbers_dicts = { **minute_words, **time_word_to_num}


class IntentParserTool(BaseModel):
    """Tool to parse user intent and identify service type"""
    
    name: str = "intent_parser"
    description: str = "Parses user message to identify service type with confidence score"
    
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract service type from user message
        
        Args:
            inputs: {"message": str}
            
        Returns:
            {"service_type": str, "confidence": float}
        """
        try:
            message = inputs.get("message", "").lower()
            
            if not message:
                return {"service_type": None, "confidence": 0.0}
            
            # Service category keywords with confidence levels
            categories = {
                "haircut": {
                    "exact": ["haircut", "hair cut"],
                    "partial": ["cut", "trim", "barber", "stylist", "hair style"],
                    "confidence": 0.95
                },
                "nails": {
                    "exact": ["nails", "manicure", "pedicure"],
                    "partial": ["nail art", "gel nails", "mani", "pedi"],
                    "confidence": 0.95
                },
                "massage": {
                    "exact": ["massage"],
                    "partial": ["deep tissue", "swedish", "hot stone", "body work", "rub"],
                    "confidence": 0.90
                },
                "spa": {
                    "exact": ["spa", "spa day"],
                    "partial": ["spa treatment", "relaxation", "pamper"],
                    "confidence": 0.85
                },
                "facial": {
                    "exact": ["facial", "face treatment"],
                    "partial": ["skincare", "skin care", "face care"],
                    "confidence": 0.90
                },
                "waxing": {
                    "exact": ["waxing", "wax"],
                    "partial": ["hair removal", "brazilian", "bikini wax"],
                    "confidence": 0.90
                },
                "makeup": {
                    "exact": ["makeup", "make up"],
                    "partial": ["cosmetics", "beauty makeup", "glam"],
                    "confidence": 0.90
                },
                "cleaning": {
                    "exact": ["cleaning", "house cleaning"],
                    "partial": ["clean", "maid", "housekeeping"],
                    "confidence": 0.85
                }
            }
            
            # Find best match
            best_match = None
            best_confidence = 0.0
            
            for category, keywords in categories.items():
                # Check exact matches
                for keyword in keywords["exact"]:
                    if keyword in message:
                        return {
                            "service_type": category,
                            "confidence": keywords["confidence"]
                        }
                
                # Check partial matches
                for keyword in keywords["partial"]:
                    if keyword in message:
                        if keywords["confidence"] > best_confidence:
                            best_match = category
                            best_confidence = keywords["confidence"] * 0.8  # Lower confidence for partial
            
            if best_match:
                return {"service_type": best_match, "confidence": best_confidence}
            
            return {"service_type": None, "confidence": 0.0}
            
        except Exception as e:
            print(f"IntentParserTool error: {e}")
            return {"service_type": None, "confidence": 0.0}


class PreferenceExtractorTool(BaseModel):
    """Tool to extract structured preferences from user message"""
    
    name: str = "preference_extractor"
    description: str = "Extracts budget, time urgency, and provider preferences from natural language"
    
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract preferences from message

        Args:
            inputs: {"message": str, "current_preferences": dict}

        Returns:
            {"budget_min": float, "budget_max": float, "time_urgency": str, "artisan_preference": str,
             "preferred_date": str, "preferred_time": str, "time_constraint": str, "location": str}
        """
        try:
            message = inputs.get("message", "")
            current_prefs = inputs.get("current_preferences", {})

            # Debug logging
            print(f"\n[PreferenceExtractor] Processing message: '{message}'")

            result = {
                "budget_min": current_prefs.get("budget_min"),
                "budget_max": current_prefs.get("budget_max"),
                "time_urgency": current_prefs.get("time_urgency"),
                "artisan_preference": current_prefs.get("artisan_preference"),
                "special_notes": current_prefs.get("special_notes"),
                "preferred_date": current_prefs.get("preferred_date"),
                "preferred_time": current_prefs.get("preferred_time"),
                "time_constraint": current_prefs.get("time_constraint"),
                "location": current_prefs.get("location")
            }

            # Extract budget
            budget = self._extract_budget(message)
            # Use explicit None checks so that a valid 0 value is preserved
            if budget["budget_min"] is not None:
                result["budget_min"] = budget["budget_min"]
            if budget["budget_max"] is not None:
                result["budget_max"] = budget["budget_max"]

            # Extract urgency (returns urgency category)
            urgency = self._extract_urgency(message)
            if urgency:
                result["time_urgency"] = urgency

            # Extract specific date and time details
            datetime_details = self._extract_datetime_details(message)
            if datetime_details["preferred_date"]:
                result["preferred_date"] = datetime_details["preferred_date"]
            if datetime_details["preferred_time"]:
                result["preferred_time"] = datetime_details["preferred_time"]
            if datetime_details["time_constraint"]:
                result["time_constraint"] = datetime_details["time_constraint"]

            # Extract artisan preference
            artisan_pref = self._extract_artisan_preference(message)
            if artisan_pref:
                result["artisan_preference"] = artisan_pref

            # Extract location (Boston/Cambridge area)
            location = self._extract_location(message)
            if location:
                result["location"] = location

            # Debug logging - show what was extracted
            extracted_items = {k: v for k, v in result.items() if v is not None}
            print(f"[PreferenceExtractor] Extracted: {extracted_items}")

            return result

        except Exception as e:
            print(f"PreferenceExtractorTool error: {e}")
            return inputs.get("current_preferences", {})
    
    def _extract_budget(self, text: str) -> Dict[str, Optional[float]]:
        """Extract budget from text"""
        # Only extract numbers with $ sign or budget-related context
        # This prevents extracting time numbers like "3 pm"

        # Convert word numbers to digits in the text
        text_converted = text
        for word, num in numbers_dicts.items():
            # Match whole words only with word boundaries
            pattern = r"\b" + word + r"\b"
            text_converted = re.sub(pattern, num, text_converted, flags=re.IGNORECASE)

        text_lower = text_converted.lower()

        # Handle "up to / under / max" style phrases FIRST so they don't get short-circuited
        # Examples: "up to 100", "up to 100$", "under 50 dollars", "max 80"
        up_to_pattern = re.search(
            r"(?:up to|under|less than|below|not more than|max(?:imum)?)\s*\$?\s*(\d+(?:\.\d{2})?)",
            text_lower,
        )
        if up_to_pattern:
            amount = float(up_to_pattern.group(1))
            return {"budget_min": 0.0, "budget_max": amount}

        # Pattern 1: Explicit dollar amounts ($50, $ 50, 50$)
        dollar_amounts = re.findall(r"\$\s*(\d+(?:\.\d{2})?)", text_converted)
        trailing_dollar_amounts = re.findall(r"(\d+(?:\.\d{2})?)\s*\$", text_converted)
        dollar_amounts.extend(trailing_dollar_amounts)

        # Pattern 2: Numbers followed by budget keywords
        budget_context = re.findall(
            r"(\d+(?:\.\d{2})?)\s*(?:dollars?|bucks?|budget)", text_lower
        )

        # Pattern 3: Range pattern (50 - 80, 50-80, 50 to 80)
        # This is a strong signal of budget even without $ or keywords
        # BUT: Exclude if it looks like a time range (has am/pm nearby or values < 24)
        range_match = re.search(
            r"(\d+(?:\.\d{2})?)\s*(?:-|to)\s*(\d+(?:\.\d{2})?)", text_lower
        )
        if range_match:
            min_val = float(range_match.group(1))
            max_val = float(range_match.group(2))

            # Skip if this looks like a time range
            # Check for time-related indicators
            match_start = range_match.start()
            match_end = range_match.end()
            text_before = text_converted[max(0, match_start-15):match_start].lower()
            text_after = text_converted[match_end:match_end+10].lower()

            # Time range indicators
            time_indicators = [
                'am', 'pm', 'between', 'available', 'open', 'hours',
                'time', 'o\'clock', 'oclock'
            ]

            has_time_context = any(
                indicator in text_before or indicator in text_after
                for indicator in time_indicators
            )

            # Both numbers < 24 suggests hours (9-5, 2-4, etc.)
            is_small_range = (min_val < 24 and max_val < 24)

            # Check if there's explicit budget context in the message
            has_budget_context = any(word in text_converted.lower() for word in [
                'budget', 'price', 'cost', 'dollar', '$', 'pay', 'spend', 'afford'
            ])

            # Skip if it looks like time
            # BUT: If numbers are >= 25, it's likely budget even without context
            #      (e.g., "50-80" is budget, "9-5" is time)
            is_likely_budget_range = max_val >= 25  # Budgets are usually $25+

            is_likely_time_range = (
                (is_small_range and has_time_context) or
                (is_small_range and not has_budget_context and not is_likely_budget_range)
            )

            if not is_likely_time_range:
                return {"budget_min": min(min_val, max_val), "budget_max": max(min_val, max_val)}

        # Combine both patterns
        all_amounts = dollar_amounts + budget_context

        if not all_amounts:
            return {"budget_min": None, "budget_max": None}

        numbers = [float(amt) for amt in all_amounts]

        # Range pattern with $ or keywords
        if len(numbers) >= 2 and ("-" in text_converted or "to" in text_converted.lower()):
            return {"budget_min": min(numbers), "budget_max": max(numbers)}

        amount = numbers[0]

        # "around", "about" → ±20%
        if any(word in text_converted.lower() for word in ["around", "about", "approximately"]):
            return {"budget_min": amount * 0.8, "budget_max": amount * 1.2}

        # "up to", "max" → explicit 0-to-max range
        if any(word in text_converted.lower() for word in ["up to", "max", "maximum", "under", "less than", "below", "not more than"]):
            # Treat these phrases as implicitly starting from 0
            return {"budget_min": 0.0, "budget_max": amount}

        # "at least", "min" → min only
        if any(word in text_converted.lower() for word in ["at least", "min", "minimum", "over", "more than", "above"]):
            return {"budget_min": amount, "budget_max": None}
        
        # Default: treat as max
        return {"budget_min": None, "budget_max": amount}
    
    def _extract_urgency(self, text: str) -> Optional[str]:
        """
        Extract time urgency category ONLY when no specific date/time is mentioned.
        If user provides specific datetime details, return None to let preferred_date/time handle it.
        """
        text_lower = text.lower()
        now = datetime.now()

        # Check if user provided specific time details (3pm, 5:30, etc.)
        has_specific_time = bool(re.search(r'\d{1,2}\s*(am|pm|:\d{2})', text_lower))

        # Check if user mentioned constraint words (before, after, by)
        has_time_constraint = any(word in text_lower for word in ["before", "after", "by"])

        # ASAP - immediate
        if any(word in text_lower for word in ["asap", "urgent", "now", "immediately", "emergency"]):
            return "ASAP"

        # Today - same day
        if any(word in text_lower for word in ["today", "this afternoon", "tonight", "this evening"]):
            # If they also mention specific time, don't return "today" - let preferred_date handle it
            if has_specific_time:
                return None
            return "today"

        # Tomorrow
        if any(word in text_lower for word in ["tomorrow", "tmr"]):
            # If they mention specific time with tomorrow, don't categorize as "week"
            if has_specific_time or has_time_constraint:
                return None
            return "week"

        # Check for specific day names
        days_of_week = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

        for day in days_of_week:
            if day in text_lower:
                # If they mention a specific day WITH time or constraint, return None
                # This allows preferred_date and preferred_time to be shown instead of generic "week"
                if has_specific_time or has_time_constraint:
                    return None
                # Otherwise, it's a general "week" request
                return "week"

        # Week-related phrases (only if no specific datetime)
        if any(word in text_lower for word in [
            "this week", "next week", "next few days", "soon", "weekend"
        ]):
            if has_specific_time or has_time_constraint:
                return None
            return "week"

        # Flexible - no rush
        if any(word in text_lower for word in ["flexible", "whenever", "anytime", "no rush", "any time"]):
            return "flexible"

        return None

    def _extract_datetime_details(self, text: str) -> Dict[str, Optional[str]]:
        """
        Extract specific date, time, and time constraints from text

        Enhanced to support:
        1. Date only: "next thursday", "tomorrow", "next week"
        2. Date + time: "next thursday 3 pm", "tomorrow at 5:30pm"
        3. Deadlines: "before next thursday", "by friday 5pm", "after monday"
        4. Date ranges: "next weekend" (converts to constraint)
        5. Relative dates: "this weekend", "next week", "end of week"

        Examples:
            "before next thursday" → date: 2025-11-27, time: None, constraint: before
            "before next thursday 3 pm" → date: 2025-11-27, time: 15:00, constraint: before
            "after 5pm tomorrow" → date: 2025-11-16, time: 17:00, constraint: after
            "next thursday" → date: 2025-11-27, time: None, constraint: None
            "monday at 2:30pm" → date: 2025-11-18, time: 14:30, constraint: None
            "next weekend" → date: 2025-11-22 (Saturday), constraint: None
            "by end of week" → date: 2025-11-21 (Friday), constraint: by

        Returns:
            {"preferred_date": str (ISO format), "preferred_time": str (24h format), "time_constraint": str}
        """
        text_lower = text.lower()
        now = datetime.now()

        result = {
            "preferred_date": None,
            "preferred_time": None,
            "time_constraint": None
        }

        print(f"[DateTimeExtractor] Processing text: '{text}'")

        # Extract time constraint (before, after, by)
        if "before" in text_lower:
            result["time_constraint"] = "before"
            print(f"[DateTimeExtractor] Found constraint: before")
        elif "after" in text_lower:
            result["time_constraint"] = "after"
            print(f"[DateTimeExtractor] Found constraint: after")
        elif "by" in text_lower:
            result["time_constraint"] = "by"
            print(f"[DateTimeExtractor] Found constraint: by")

        # Convert time words to numbers (e.g., "three pm" -> "3 pm", "ten thirty am" -> "10:30 am")
        text_with_time_numbers = text_lower

        # Look for patterns like "five thirty pm" or "ten fifteen am"
        for hour_word, hour_num in time_word_to_num.items():
            for minute_word, minute_num in minute_words.items():
                # Pattern: "five thirty pm"
                pattern = r'\b' + hour_word + r'\s+' + minute_word + r'\b(?=\s*(am|pm))'
                replacement = hour_num + ':' + minute_num
                text_with_time_numbers = re.sub(
                    pattern,
                    replacement,
                    text_with_time_numbers,
                    flags=re.IGNORECASE
                )

        # Then handle simple hour expressions like "three pm"
        for word, num in time_word_to_num.items():
            # Match whole words followed by am/pm or o'clock
            # Pattern: "three pm" or "three o'clock"
            text_with_time_numbers = re.sub(
                r'\b' + word + r'\b(?=\s*(am|pm|o\'clock|oclock))',
                num,
                text_with_time_numbers,
                flags=re.IGNORECASE
            )

        # Handle "o'clock" format (e.g., "three o'clock" -> "3:00")
        text_with_time_numbers = re.sub(
            r'(\d{1,2})\s*(?:o\'clock|oclock)',
            r'\1:00',
            text_with_time_numbers,
            flags=re.IGNORECASE
        )

        print(f"[DateTimeExtractor] After time word conversion: '{text_with_time_numbers}'")

        # Extract specific time (e.g., "3 pm", "3pm", "15:00", "3:30pm")
        time_patterns = [
            r'(\d{1,2}):(\d{2})\s*(am|pm)',  # 3:30pm, 3:30 pm
            r'(\d{1,2})\s*(am|pm)',           # 3pm, 3 pm
            r'(\d{1,2}):(\d{2})'              # 15:00, 3:30 (24h format)
        ]

        for pattern in time_patterns:
            match = re.search(pattern, text_with_time_numbers)
            if match:
                groups = match.groups()

                if len(groups) == 2 and groups[1] in ['am', 'pm']:
                    # Format: "3pm" or "3 pm"
                    hour = int(groups[0])
                    minute = 0
                    if groups[1] == 'pm' and hour != 12:
                        hour += 12
                    elif groups[1] == 'am' and hour == 12:
                        hour = 0
                    result["preferred_time"] = f"{hour:02d}:{minute:02d}"
                    print(f"[DateTimeExtractor] Found time: {result['preferred_time']}")
                    break

                elif len(groups) == 3 and groups[2] in ['am', 'pm']:
                    # Format: "3:30pm" or "3:30 pm"
                    hour = int(groups[0])
                    minute = int(groups[1])
                    if groups[2] == 'pm' and hour != 12:
                        hour += 12
                    elif groups[2] == 'am' and hour == 12:
                        hour = 0
                    result["preferred_time"] = f"{hour:02d}:{minute:02d}"
                    print(f"[DateTimeExtractor] Found time: {result['preferred_time']}")
                    break

                elif len(groups) == 2 and groups[0] and groups[1]:
                    # Format: "15:00" (24h format)
                    hour = int(groups[0])
                    minute = int(groups[1])
                    if 0 <= hour <= 23 and 0 <= minute <= 59:
                        result["preferred_time"] = f"{hour:02d}:{minute:02d}"
                        print(f"[DateTimeExtractor] Found time: {result['preferred_time']}")
                        break

        # Extract specific date
        # Day names with context
        days_of_week = {
            "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
            "friday": 4, "saturday": 5, "sunday": 6
        }

        current_weekday = now.weekday()

        # Check for "today"
        if "today" in text_lower:
            result["preferred_date"] = now.date().isoformat()
            print(f"[DateTimeExtractor] Found 'today': {result['preferred_date']}")

        # Check for "tomorrow"
        elif "tomorrow" in text_lower or "tmr" in text_lower:
            tomorrow = now + timedelta(days=1)
            result["preferred_date"] = tomorrow.date().isoformat()
            print(f"[DateTimeExtractor] Found 'tomorrow': {result['preferred_date']}")

        # Check for "weekend" or "next weekend"
        elif "weekend" in text_lower:
            # Weekend = Saturday and Sunday
            # "next weekend" or "this weekend" - we'll use Saturday as the target
            is_next = "next" in text_lower

            # Current day is 0=Mon, 1=Tue, ..., 5=Sat, 6=Sun
            # If today is Mon-Thu (0-4), "weekend" = this Saturday
            # If today is Fri-Sun (5-6), "weekend" = this Saturday (if Fri) or today (if Sat/Sun)

            if current_weekday <= 4:  # Mon-Fri
                # This weekend's Saturday
                days_until_saturday = 5 - current_weekday
                if is_next and current_weekday <= 4:
                    # "next weekend" when it's Mon-Fri means next week's Saturday
                    days_until_saturday += 7
            else:  # Sat-Sun
                # Already the weekend
                if current_weekday == 5:  # Saturday
                    days_until_saturday = 0 if not is_next else 7
                else:  # Sunday
                    days_until_saturday = 6 if not is_next else 13  # 6 days to next Sat

            weekend_date = now + timedelta(days=days_until_saturday)
            result["preferred_date"] = weekend_date.date().isoformat()
            print(f"[DateTimeExtractor] Found 'weekend': {result['preferred_date']} (Saturday)")

        # Check for "end of week" or "end of the week"
        elif "end of" in text_lower and "week" in text_lower:
            # End of week = Friday
            days_until_friday = (4 - current_weekday) % 7
            if days_until_friday == 0 and now.hour >= 17:  # It's Friday evening
                days_until_friday = 7  # Next Friday

            friday_date = now + timedelta(days=days_until_friday)
            result["preferred_date"] = friday_date.date().isoformat()
            print(f"[DateTimeExtractor] Found 'end of week': {result['preferred_date']} (Friday)")

        # Check for "next week" (without specific day)
        # IMPORTANT: Only match "next week" if NO specific day is mentioned.
        # Otherwise "next week on Monday" gets caught here and returns Monday (generic start of week),
        # preventing the specific day logic from running.
        elif "next week" in text_lower and not any(day in text_lower for day in days_of_week):
            # Next week = start of next week (Monday)
            days_until_next_monday = (7 - current_weekday) % 7
            if days_until_next_monday == 0:  # Today is Monday
                days_until_next_monday = 7

            next_monday = now + timedelta(days=days_until_next_monday)
            result["preferred_date"] = next_monday.date().isoformat()
            print(f"[DateTimeExtractor] Found 'next week': {result['preferred_date']} (Monday)")

        # Check for specific day names
        else:
            for day_name, day_num in days_of_week.items():
                if day_name in text_lower:
                    # Determine if "next" is mentioned
                    is_next_week = "next" in text_lower

                    # Calculate days until that day
                    days_ahead = day_num - current_weekday

                    if is_next_week:
                        # "next thursday" always means next week
                        if days_ahead <= 0:
                            days_ahead += 7
                        else:
                            days_ahead += 7
                    elif days_ahead < 0:
                        # Day has already passed this week, go to next week
                        days_ahead += 7
                    elif days_ahead == 0:
                        # It's today - check if user mentioned time constraint
                        # If "before" or "by" is mentioned, they probably mean today
                        # Otherwise, they might mean next week
                        if "before" in text_lower or "by" in text_lower:
                            # Keep days_ahead = 0 (today)
                            pass
                        else:
                            # Assume next occurrence of this day
                            days_ahead = 7

                    target_date = now + timedelta(days=days_ahead)
                    result["preferred_date"] = target_date.date().isoformat()
                    print(f"[DateTimeExtractor] Found {day_name} → date: {result['preferred_date']} (days_ahead: {days_ahead}, is_next_week: {is_next_week})")
                    break

        print(f"[DateTimeExtractor] Final result: {result}")
        return result

    def _extract_artisan_preference(self, text: str) -> Optional[str]:
        """Extract provider preferences"""
        text_lower = text.lower()
        preferences = []

        # Gender
        if "female" in text_lower or "woman" in text_lower:
            preferences.append("female")
        if "male" in text_lower or "man" in text_lower and "female" not in text_lower:
            preferences.append("male")

        # Experience
        if any(word in text_lower for word in ["experienced", "senior", "expert", "professional"]):
            preferences.append("experienced")

        # Openness
        if any(word in text_lower for word in ["open", "anyone", "no preference", "any"]):
            return "open to anyone"

        return " ".join(preferences) if preferences else None

    def _extract_location(self, text: str) -> Optional[str]:
        """
        Extract location preference with state disambiguation.
        Supports Boston/Cambridge (MA) and New York (NY) areas.
        Also supports place-based locations (subway stations, landmarks, etc.)

        Returns location with state suffix to avoid ambiguity (e.g., "Cambridge, MA" not "Cambridge").
        For place-based: "MIT station, Cambridge, MA"
        Returns "AMBIGUOUS:city_name" if location needs clarification.
        """
        text_lower = text.lower()

        # Place-based keywords (landmarks, subway stations, etc.)
        # These return specific place + city for more accurate search
        place_keywords_ma = {
            "mit station": ("MIT station", "Cambridge, MA"),
            "mit subway": ("MIT station", "Cambridge, MA"),
            "kendall station": ("Kendall/MIT station", "Cambridge, MA"),
            "kendall square": ("Kendall Square", "Cambridge, MA"),
            "harvard square": ("Harvard Square", "Cambridge, MA"),
            "harvard station": ("Harvard station", "Cambridge, MA"),
            "central square": ("Central Square", "Cambridge, MA"),
            "porter square": ("Porter Square", "Cambridge, MA"),
            "porter station": ("Porter station", "Cambridge, MA"),
            "davis square": ("Davis Square", "Somerville, MA"),
            "park street": ("Park Street station", "Boston, MA"),
            "downtown crossing": ("Downtown Crossing", "Boston, MA"),
            "south station": ("South Station", "Boston, MA"),
            "north station": ("North Station", "Boston, MA"),
            "back bay station": ("Back Bay station", "Boston, MA"),
            "copley square": ("Copley Square", "Boston, MA"),
            "copley station": ("Copley station", "Boston, MA"),
            "prudential": ("Prudential Center", "Boston, MA"),
            "fenway park": ("Fenway Park", "Boston, MA"),
            "newbury street": ("Newbury Street", "Boston, MA"),
        }

        place_keywords_ny = {
            "times square": ("Times Square", "New York, NY"),
            "grand central": ("Grand Central", "New York, NY"),
            "penn station": ("Penn Station", "New York, NY"),
            "union square": ("Union Square", "New York, NY"),
            "columbus circle": ("Columbus Circle", "New York, NY"),
            "rockefeller": ("Rockefeller Center", "New York, NY"),
            "central park": ("Central Park", "New York, NY"),
            "brooklyn bridge": ("Brooklyn Bridge", "New York, NY"),
            "world trade": ("World Trade Center", "New York, NY"),
        }

        # Check for specific places first (most specific match wins)
        # Sort by keyword length (longest first) to match most specific
        all_places = {**place_keywords_ma, **place_keywords_ny}
        for keyword in sorted(all_places.keys(), key=len, reverse=True):
            if keyword in text_lower:
                place_name, city = all_places[keyword]
                return f"{place_name}, {city}"

        # Boston area keywords (Massachusetts)
        boston_keywords = [
            "boston", "back bay", "south end", "north end", "beacon hill",
            "downtown boston", "fenway", "allston", "brighton", "jamaica plain",
            "roxbury", "dorchester", "southie", "south boston", "charlestown",
            "brookline", "newton", "somerville"
        ]

        # Cambridge area keywords (Massachusetts) - could be confused with UK
        cambridge_ma_keywords = [
            "harvard square", "central square", "kendall square",
            "porter square", "davis square", "inman square", "mit",
            "cambridge ma", "cambridge, ma", "cambridge massachusetts"
        ]

        # New York City area keywords
        nyc_keywords = [
            "new york", "nyc", "manhattan", "brooklyn", "queens", "bronx",
            "staten island", "harlem", "soho", "tribeca", "chelsea",
            "greenwich village", "east village", "west village", "midtown",
            "upper east side", "upper west side", "lower east side",
            "williamsburg", "bushwick", "astoria", "flushing", "dumbo",
            "times square", "wall street", "flatiron", "noho", "nolita"
        ]

        # Track what we found
        found_boston = any(kw in text_lower for kw in boston_keywords)
        found_cambridge = "cambridge" in text_lower
        found_cambridge_ma = any(kw in text_lower for kw in cambridge_ma_keywords)
        found_nyc = any(kw in text_lower for kw in nyc_keywords)
        found_ma_context = any(kw in text_lower for kw in ["ma", "massachusetts", "mass"])
        found_ny_context = any(kw in text_lower for kw in ["ny", "new york"])
        found_uk_context = any(kw in text_lower for kw in ["uk", "england", "british"])

        # Handle multiple cities mentioned (e.g., "boston, cambridge" or "boston or new york")
        locations = []

        if found_boston or found_cambridge_ma or (found_cambridge and found_ma_context):
            if found_boston:
                locations.append("Boston, MA")
            if found_cambridge_ma or (found_cambridge and (found_ma_context or found_boston)):
                # Cambridge with MA context or mentioned alongside Boston
                locations.append("Cambridge, MA")

        if found_nyc:
            locations.append("New York, NY")

        # If user said both Boston area and NYC
        if len(locations) > 1:
            return "/".join(locations)  # e.g., "Boston, MA/New York, NY"

        if len(locations) == 1:
            return locations[0]

        # Handle ambiguous "cambridge" without MA context
        if found_cambridge and not found_cambridge_ma and not found_ma_context and not found_boston:
            # Check for UK context
            if found_uk_context:
                return "AMBIGUOUS:cambridge_uk"  # Signal to ask for clarification
            # No clear context - needs clarification
            return "AMBIGUOUS:cambridge"

        # Generic state references
        if found_ma_context and not found_nyc:
            return "Boston, MA"  # Default to Boston for generic MA references

        if found_ny_context and not found_boston and not found_cambridge:
            return "New York, NY"  # Default to NYC for generic NY references

        # Check for "either" or "both" - user is flexible within current pilot cities
        if any(phrase in text_lower for phrase in ["either", "both", "anywhere", "any area", "doesn't matter"]):
            return "Boston, MA/Cambridge, MA"

        return None


def detect_time_suggestion_acceptance(
    user_message: str,
    last_assistant_message: str = ""
) -> Dict[str, Any]:
    """
    Detect if the user is accepting a time suggestion from the agent.

    Returns:
        {
            "accepted": bool,
            "suggested_date": str or None (ISO format),
            "suggested_time": str or None (HH:MM format),
            "day_before_event": str or None (event name if suggesting day before)
        }
    """
    import re
    from datetime import datetime, timedelta

    result = {
        "accepted": False,
        "suggested_date": None,
        "suggested_time": None,
        "day_before_event": None
    }

    user_lower = user_message.lower().strip()
    assistant_lower = last_assistant_message.lower()

    # Acceptance patterns
    acceptance_patterns = [
        "yes", "yeah", "yep", "sure", "ok", "okay", "sounds good",
        "that works", "perfect", "great", "let's do it", "book it",
        "i'll take it", "that's perfect", "works for me", "let's go",
        "confirmed", "confirm", "accept", "agreed"
    ]

    # Check if user is accepting
    is_accepting = any(pattern in user_lower for pattern in acceptance_patterns)

    if not is_accepting:
        return result

    result["accepted"] = True
    now = datetime.now()

    print(f"[TimeAcceptance] User accepted! Extracting from: {assistant_lower[:200]}...")

    # Extract time from assistant message - look for patterns like "11:00 AM", "2:30 PM"
    time_match = re.search(r'(\d{1,2}):(\d{2})\s*(am|pm)', assistant_lower)
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2))
        ampm = time_match.group(3)

        if ampm == 'pm' and hour != 12:
            hour += 12
        elif ampm == 'am' and hour == 12:
            hour = 0

        result["suggested_time"] = f"{hour:02d}:{minute:02d}"
        print(f"[TimeAcceptance] Extracted time: {result['suggested_time']}")

    # Extract date - FIRST try explicit date patterns (more reliable)
    # Pattern: "December 02", "Dec 2", "January 15", etc.
    months = {
        "january": 1, "jan": 1, "february": 2, "feb": 2, "march": 3, "mar": 3,
        "april": 4, "apr": 4, "may": 5, "june": 6, "jun": 6, "july": 7, "jul": 7,
        "august": 8, "aug": 8, "september": 9, "sep": 9, "october": 10, "oct": 10,
        "november": 11, "nov": 11, "december": 12, "dec": 12
    }

    # Try to find explicit month + day patterns
    date_found = False
    for month_name, month_num in months.items():
        # Match patterns like "December 02", "Dec 2", "december 15"
        pattern = rf'{month_name}\s+(\d{{1,2}})'
        match = re.search(pattern, assistant_lower)
        if match:
            day = int(match.group(1))
            year = now.year
            # If the date is in the past, assume next year
            try:
                target_date = datetime(year, month_num, day)
                if target_date.date() < now.date():
                    target_date = datetime(year + 1, month_num, day)
                result["suggested_date"] = target_date.strftime("%Y-%m-%d")
                date_found = True
                print(f"[TimeAcceptance] Extracted date from '{month_name} {day}': {result['suggested_date']}")
                break
            except ValueError:
                continue

    # If no explicit date found, try day names
    if not date_found:
        days_of_week = {
            "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
            "friday": 4, "saturday": 5, "sunday": 6
        }

        for day_name, day_num in days_of_week.items():
            if day_name in assistant_lower:
                current_weekday = now.weekday()
                days_ahead = day_num - current_weekday
                # Allow same day (days_ahead == 0) or future days
                if days_ahead < 0:
                    days_ahead += 7
                target_date = now + timedelta(days=days_ahead)
                result["suggested_date"] = target_date.strftime("%Y-%m-%d")
                print(f"[TimeAcceptance] Extracted date from day name '{day_name}': {result['suggested_date']}")
                break

    # Special keywords
    if "tomorrow" in assistant_lower:
        result["suggested_date"] = (now + timedelta(days=1)).strftime("%Y-%m-%d")
        print(f"[TimeAcceptance] Extracted 'tomorrow': {result['suggested_date']}")

    if "today" in assistant_lower and not result["suggested_date"]:
        result["suggested_date"] = now.strftime("%Y-%m-%d")
        print(f"[TimeAcceptance] Extracted 'today': {result['suggested_date']}")

    # Check if this was a "day before" suggestion
    if "day before" in assistant_lower or "before your" in assistant_lower:
        event_patterns = [
            r"before (?:your|the) ([^!.]+?)(?:\!|\.|\?|$)",
            r"before ([^!.]+?) so you",
        ]
        for pattern in event_patterns:
            match = re.search(pattern, assistant_lower)
            if match:
                result["day_before_event"] = match.group(1).strip()
                print(f"[TimeAcceptance] Day before event: {result['day_before_event']}")
                break

    print(f"[TimeAcceptance] Final result: {result}")
    return result


class ClarifyingQuestionGeneratorTool(BaseModel):
    """Tool to generate clarifying questions based on missing information"""

    name: str = "clarifying_question_generator"
    description: str = "Generates natural follow-up questions for missing preference fields"
    
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate clarifying question
        
        Args:
            inputs: {"current_preferences": dict, "missing_fields": list}
            
        Returns:
            {"question": str, "field": str}
        """
        try:
            missing_fields = inputs.get("missing_fields", [])
            
            if not missing_fields:
                return {
                    "question": "Perfect! Let me find the best matches for you!",
                    "field": None
                }
            
            # Get first missing field
            field = missing_fields[0]
            
            # Question templates
            questions = {
                "service_type": "What service are you looking for?",
                "budget": "What's your budget for this service?",
                "time_info": "When do you need this?",  # Changed from time_urgency to time_info
                "location": "Where would you like to get this done? We're currently serving Boston, Cambridge (MA), and New York City.",
                "location_ambiguous_cambridge": "Did you mean Cambridge, Massachusetts (near Boston) or somewhere else? We're currently serving the Boston/Cambridge area and NYC.",
                "artisan_preference": "Any preferences for the provider?"
            }
            
            question = questions.get(field, "Can you tell me more about what you're looking for?")
            
            return {"question": question, "field": field}
            
        except Exception as e:
            print(f"ClarifyingQuestionGeneratorTool error: {e}")
            return {
                "question": "What service are you looking for?",
                "field": "service_type"
            }


class ConversationContextManagerTool(BaseModel):
    """Tool to manage conversation context and build summaries"""
    
    name: str = "conversation_context_manager"
    description: str = "Manages conversation history and builds context summaries"
    
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build conversation context
        
        Args:
            inputs: {"conversation_history": list, "extracted_data": dict}
            
        Returns:
            {"context": str, "summary": str}
        """
        try:
            history = inputs.get("conversation_history", [])
            extracted = inputs.get("extracted_data", {})
            
            # Build context from last 4 messages
            context_messages = history[-4:] if len(history) > 4 else history
            context = "\n".join([
                f"{msg.get('role', 'user').upper()}: {msg.get('content', '')}"
                for msg in context_messages
            ])
            
            # Build summary of what we know
            summary_parts = []
            if extracted.get("service_type"):
                summary_parts.append(f"Service: {extracted['service_type']}")
            if extracted.get("budget_max"):
                summary_parts.append(f"Budget: ${extracted['budget_max']}")
            if extracted.get("time_urgency"):
                summary_parts.append(f"When: {extracted['time_urgency']}")
            if extracted.get("location"):
                summary_parts.append(f"Location: {extracted['location']}")

            summary = " | ".join(summary_parts) if summary_parts else "No preferences yet"
            
            return {
                "context": context,
                "summary": summary
            }
            
        except Exception as e:
            print(f"ConversationContextManagerTool error: {e}")
            return {"context": "", "summary": ""}


class DateTimeContextTool(BaseModel):
    """Tool to provide current date/time context"""

    name: str = "datetime_context"
    description: str = "Provides current date and time context for understanding relative dates"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get current date/time context

        Returns:
            dict with current date/time information
        """
        now = datetime.now()

        # Calculate day of week
        day_name = now.strftime("%A")  # e.g., "Thursday"
        date_str = now.strftime("%B %d, %Y")  # e.g., "November 15, 2025"
        time_str = now.strftime("%I:%M %p")  # e.g., "5:30 PM"

        # Calculate tomorrow
        tomorrow = now + timedelta(days=1)
        tomorrow_name = tomorrow.strftime("%A")

        # Days until weekend
        days_until_weekend = (5 - now.weekday()) if now.weekday() < 5 else 0

        return {
            "current_day": day_name,
            "current_date": date_str,
            "current_time": time_str,
            "full_datetime": f"{day_name}, {date_str} at {time_str}",
            "tomorrow": tomorrow_name,
            "days_until_weekend": days_until_weekend,
            "is_weekend": now.weekday() >= 5
        }


async def extract_location_with_llm(
    text: str,
    llm,
    current_location: Optional[str] = None
) -> Optional[str]:
    """
    Use LLM to dynamically extract any place-based location in Boston/Cambridge (MA) or NYC.

    Supports any place like:
    - Subway stations: "MIT subway station", "Grand Central"
    - Landmarks: "near the Public Library", "close to Central Park"
    - Streets: "on Newbury Street", "near Times Square"
    - Neighborhoods: "in Beacon Hill", "around SoHo"
    - Addresses: "53 Wheeler St"

    Returns a location string with city and state, e.g., "MIT station, Cambridge, MA"
    Returns "AMBIGUOUS:cambridge" if clarification is needed.
    Returns None if no location mentioned.
    """
    text_lower = text.lower()

    # Quick check if any location-related words are present
    location_signals = [
        "in ", "near ", "around ", "close to ", "at ", "on ",
        "boston", "cambridge", "new york", "nyc", "manhattan", "brooklyn",
        "station", "square", "street", "st ", "avenue", "ave ", "park",
        "subway", "metro", "landmark", "neighborhood", "area"
    ]

    has_location_signal = any(signal in text_lower for signal in location_signals)

    if not has_location_signal:
        return current_location  # Keep existing location

    # Check for UK context to avoid confusion
    uk_context = any(kw in text_lower for kw in ["uk", "england", "british"])

    prompt = f"""Extract the location from this message for a beauty service search.

Message: "{text}"
Current location (if any): {current_location or "none"}

CRITICAL RULES:
1. ONLY extract a location if the user EXPLICITLY mentions a place, city, neighborhood, street, or landmark.
2. DO NOT assume or default to any city. If no location is mentioned, return "NONE".
3. DO NOT infer location from context or guess. The user must say it.
4. We ONLY serve Boston/Cambridge (Massachusetts) and New York City areas.
5. If a location IS mentioned, append the correct state: ", MA" for Massachusetts or ", NY" for New York.
6. If user says just "Cambridge" without state context, return "AMBIGUOUS:cambridge" (could be UK or MA).
7. If location is outside our service area (e.g., "Los Angeles"), return "UNSUPPORTED:location_name".

Examples:
- "I want a massage" → "NONE" (no location mentioned)
- "before next friday" → "NONE" (no location mentioned)
- "$50 budget" → "NONE" (no location mentioned)
- "near MIT subway station" → "MIT station, Cambridge, MA"
- "around Times Square" → "Times Square, New York, NY"
- "in Boston" → "Boston, MA"
- "on Newbury Street" → "Newbury Street, Boston, MA"
- "I'm in cambridge" → "AMBIGUOUS:cambridge"
- "in cambridge ma" or "cambridge massachusetts" → "Cambridge, MA"
- "near the boston public library" → "Boston Public Library, Boston, MA"
- "53 Wheeler St Cambridge" → "53 Wheeler St, Cambridge, MA"

Return ONLY the location string, nothing else. Return "NONE" if no location is explicitly stated."""

    try:
        response = await llm.ainvoke(prompt)
        result = response.content.strip().strip('"').strip("'")

        # Handle special cases
        if result == "NONE" or not result:
            return current_location

        if result.startswith("UNSUPPORTED:"):
            print(f"[LocationExtractor] Unsupported location: {result}")
            return None  # Will trigger location clarification question

        if result.startswith("AMBIGUOUS:"):
            return result  # Pass through for clarification handling

        # Ensure state is appended
        if result and "MA" not in result and "NY" not in result:
            # Default to MA if unclear
            if "new york" in result.lower() or "nyc" in result.lower() or "brooklyn" in result.lower() or "manhattan" in result.lower():
                result = f"{result}, NY"
            else:
                result = f"{result}, MA"

        print(f"[LocationExtractor] LLM extracted location: {result}")
        return result

    except Exception as e:
        print(f"[LocationExtractor] LLM error: {e}")
        # Fall back to rule-based extraction
        return None


class ReadinessDetectorTool(BaseModel):
    """Tool to detect if user is ready for matching"""
    
    name: str = "readiness_detector"
    description: str = "Determines if we have enough information to match user with providers"
    
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check readiness for matching
        
        Args:
            inputs: {"current_preferences": dict}
            
        Returns:
            {"ready_to_match": bool, "missing_fields": list, "completeness": float}
        """
        try:
            prefs = inputs.get("current_preferences", {})

            # For time, accept EITHER time_urgency (general) OR preferred_date/time/constraint (specific)
            # Cases:
            # 1. "before next thursday" → time_constraint="before", preferred_date="2025-11-27"
            # 2. "before next thursday 3pm" → time_constraint="before", preferred_date="2025-11-27", preferred_time="15:00"
            # 3. "next thursday" → preferred_date="2025-11-27"
            has_time_info = bool(
                prefs.get("time_urgency") or
                prefs.get("preferred_date") or
                prefs.get("preferred_time") or
                prefs.get("time_constraint")
            )

            # Debug logging
            print(f"\n[ReadinessDetector] Checking preferences:")
            print(f"  service_type: {prefs.get('service_type')}")
            print(f"  budget: {prefs.get('budget_min') or prefs.get('budget_max')}")
            print(f"  time_urgency: {prefs.get('time_urgency')}")
            print(f"  preferred_date: {prefs.get('preferred_date')}")
            print(f"  preferred_time: {prefs.get('preferred_time')}")
            print(f"  time_constraint: {prefs.get('time_constraint')}")
            print(f"  location: {prefs.get('location')}")
            print(f"  has_time_info: {has_time_info}")

            # Required fields
            required = {
                "service_type": prefs.get("service_type"),
                "budget": prefs.get("budget_min") or prefs.get("budget_max"),
                "time_info": has_time_info,  # Accept any form of time information
                "location": prefs.get("location")  # Boston/Cambridge area
            }

            # Optional field
            optional = {
                "artisan_preference": prefs.get("artisan_preference")
            }

            # Find missing required fields
            missing_fields = [
                field for field, value in required.items()
                if not value  # Changed from "is None" to handle boolean False
            ]
            
            # Calculate completeness (including optional)
            total_fields = len(required) + len(optional)
            filled_fields = sum(1 for v in required.values() if v)  # Use truthiness for boolean
            filled_fields += sum(1 for v in optional.values() if v is not None)
            completeness = filled_fields / total_fields
            
            # Ready if all required fields present
            ready_to_match = len(missing_fields) == 0

            print(f"[ReadinessDetector] Result: ready_to_match={ready_to_match}, missing_fields={missing_fields}\n")

            return {
                "ready_to_match": ready_to_match,
                "missing_fields": missing_fields,
                "completeness": round(completeness, 2)
            }
            
        except Exception as e:
            print(f"ReadinessDetectorTool error: {e}")
            return {
                "ready_to_match": False,
                "missing_fields": ["service_type", "budget", "time_info", "location"],
                "completeness": 0.0
            }


# Tool instances for easy import
intent_parser_tool = IntentParserTool()
preference_extractor_tool = PreferenceExtractorTool()
clarifying_question_generator_tool = ClarifyingQuestionGeneratorTool()
conversation_context_manager_tool = ConversationContextManagerTool()
datetime_context_tool = DateTimeContextTool()
readiness_detector_tool = ReadinessDetectorTool()



