"""
Price Estimation Utility for GlowGo
Maps Yelp price_range to estimated dollar amounts based on service category
"""

from typing import Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# Price Estimation Mappings
# ============================================================================

# Base price ranges for each price_range indicator
# Format: price_range -> (min_price, max_price)
PRICE_RANGE_BASE: Dict[str, Tuple[float, float]] = {
    "$": (15, 40),
    "$$": (40, 80),
    "$$$": (80, 150),
    "$$$$": (150, 300),
}

# Category-specific price multipliers
# Some services are inherently more expensive than others
CATEGORY_MULTIPLIERS: Dict[str, float] = {
    # Hair services
    "haircut": 1.0,
    "hair salon": 1.0,
    "barbershop": 0.8,
    "hair stylists": 1.0,
    "men's hair salons": 0.8,
    "blow dry/out services": 0.7,
    "hair extensions": 2.5,
    "hair coloring": 1.8,

    # Nail services
    "nails": 0.8,
    "nail salon": 0.8,

    # Body services
    "massage": 1.5,
    "spa": 1.8,
    "day spa": 1.8,

    # Face services
    "facial": 1.3,
    "skin care": 1.3,

    # Beauty services
    "makeup": 1.2,
    "beauty salon": 1.0,
    "cosmetics": 1.0,

    # Other services
    "waxing": 0.8,
    "hair removal": 0.8,
    "eyebrow services": 0.6,
    "eyelash service": 1.0,
    "tanning": 0.7,

    # Generic
    "cleaning": 0.9,
}

# Default service names and durations for each category
DEFAULT_SERVICES: Dict[str, list] = {
    "haircut": [
        {"name": "Haircut", "duration": 30},
        {"name": "Haircut & Style", "duration": 45},
    ],
    "hair salon": [
        {"name": "Haircut", "duration": 30},
        {"name": "Color Service", "duration": 90},
        {"name": "Blowout", "duration": 45},
    ],
    "barbershop": [
        {"name": "Men's Haircut", "duration": 30},
        {"name": "Beard Trim", "duration": 15},
        {"name": "Hot Towel Shave", "duration": 30},
    ],
    "nail salon": [
        {"name": "Manicure", "duration": 30},
        {"name": "Pedicure", "duration": 45},
        {"name": "Gel Manicure", "duration": 45},
    ],
    "nails": [
        {"name": "Manicure", "duration": 30},
        {"name": "Pedicure", "duration": 45},
    ],
    "massage": [
        {"name": "Swedish Massage (60 min)", "duration": 60},
        {"name": "Deep Tissue Massage (60 min)", "duration": 60},
        {"name": "Relaxation Massage (30 min)", "duration": 30},
    ],
    "spa": [
        {"name": "Spa Package", "duration": 120},
        {"name": "Body Treatment", "duration": 60},
        {"name": "Relaxation Massage", "duration": 60},
    ],
    "day spa": [
        {"name": "Day Spa Package", "duration": 180},
        {"name": "Half-Day Retreat", "duration": 120},
    ],
    "facial": [
        {"name": "Classic Facial", "duration": 60},
        {"name": "Deep Cleansing Facial", "duration": 75},
        {"name": "Express Facial", "duration": 30},
    ],
    "skin care": [
        {"name": "Skincare Treatment", "duration": 60},
        {"name": "Consultation & Treatment", "duration": 75},
    ],
    "makeup": [
        {"name": "Makeup Application", "duration": 45},
        {"name": "Special Event Makeup", "duration": 60},
        {"name": "Bridal Makeup", "duration": 90},
    ],
    "waxing": [
        {"name": "Eyebrow Wax", "duration": 15},
        {"name": "Full Face Wax", "duration": 30},
        {"name": "Full Leg Wax", "duration": 45},
    ],
    "eyebrow services": [
        {"name": "Eyebrow Shaping", "duration": 15},
        {"name": "Eyebrow Tint", "duration": 20},
        {"name": "Brow Lamination", "duration": 45},
    ],
    "eyelash service": [
        {"name": "Lash Lift", "duration": 45},
        {"name": "Lash Extensions", "duration": 90},
        {"name": "Lash Tint", "duration": 20},
    ],
}


def estimate_price_from_range(
    price_range: str,
    service_category: str,
    use_midpoint: bool = True
) -> float:
    """
    Estimate actual dollar price from Yelp price_range.

    Args:
        price_range: Yelp price indicator ("$", "$$", "$$$", "$$$$")
        service_category: Type of service (e.g., "haircut", "massage")
        use_midpoint: If True, return midpoint; if False, return range

    Returns:
        Estimated price in dollars
    """
    # Clean the price range
    price_range = price_range.strip() if price_range else "$"

    # Get base price range
    if price_range not in PRICE_RANGE_BASE:
        logger.warning(f"Unknown price_range '{price_range}', defaulting to '$'")
        price_range = "$"

    min_price, max_price = PRICE_RANGE_BASE[price_range]

    # Apply category multiplier
    category_lower = service_category.lower() if service_category else "haircut"
    multiplier = CATEGORY_MULTIPLIERS.get(category_lower, 1.0)

    adjusted_min = min_price * multiplier
    adjusted_max = max_price * multiplier

    if use_midpoint:
        return round((adjusted_min + adjusted_max) / 2, 2)
    else:
        return adjusted_min, adjusted_max


def get_price_range_bounds(
    price_range: str,
    service_category: str
) -> Tuple[float, float]:
    """
    Get min and max price bounds for a price_range.

    Returns:
        Tuple of (min_price, max_price)
    """
    return estimate_price_from_range(price_range, service_category, use_midpoint=False)


def generate_services_for_merchant(
    price_range: str,
    service_category: str,
    business_name: str
) -> list:
    """
    Generate service entries with estimated prices for a merchant.

    Args:
        price_range: Yelp price indicator
        service_category: Type of service
        business_name: Name of the business (for logging)

    Returns:
        List of service dictionaries ready for database insertion
    """
    services = []

    # Get category-specific services or default
    category_lower = service_category.lower() if service_category else "haircut"
    service_templates = DEFAULT_SERVICES.get(category_lower, [
        {"name": "Standard Service", "duration": 60}
    ])

    # Get base price estimate
    base_price = estimate_price_from_range(price_range, service_category)

    for i, template in enumerate(service_templates):
        # Vary prices slightly for different services
        # First service is base price, others vary ±20%
        if i == 0:
            price = base_price
        else:
            variance = 1 + (0.2 * (i - len(service_templates) // 2) / len(service_templates))
            price = round(base_price * variance, 2)

        service = {
            "service_name": template["name"],
            "description": f"{template['name']} at {business_name}",
            "base_price": price,
            "duration_minutes": template["duration"],
            "is_estimated_price": True,
            "data_source": "yelp_estimated"
        }
        services.append(service)

    logger.debug(f"Generated {len(services)} services for {business_name} with base price ${base_price}")
    return services


def is_within_budget(
    price_range: str,
    service_category: str,
    user_budget: float,
    flexibility_percent: float = 10.0
) -> bool:
    """
    Check if a merchant's price range fits within user's budget.

    Args:
        price_range: Yelp price indicator
        service_category: Type of service
        user_budget: User's maximum budget in dollars
        flexibility_percent: Allow this % over budget

    Returns:
        True if merchant likely fits budget
    """
    min_price, max_price = get_price_range_bounds(price_range, service_category)

    # User budget with flexibility
    max_allowed = user_budget * (1 + flexibility_percent / 100)

    # Check if minimum price is within budget
    # (even expensive places might have affordable options)
    return min_price <= max_allowed


def map_yelp_category_to_service(yelp_categories: list) -> str:
    """
    Map Yelp category aliases to our service_category values.

    Args:
        yelp_categories: List of Yelp category dicts with 'alias' and 'title'

    Returns:
        Best matching service_category string
    """
    # Priority order for category mapping
    category_map = {
        "barbers": "barbershop",
        "hair": "hair salon",
        "hairsalons": "hair salon",
        "hairstylists": "hair salon",
        "blowoutservices": "hair salon",
        "hair_extensions": "hair salon",
        "menshairstylists": "barbershop",

        "nail_salons": "nail salon",
        "nailsalons": "nail salon",

        "massage": "massage",
        "massage_therapy": "massage",

        "spas": "spa",
        "day_spas": "day spa",
        "medicalspa": "spa",

        "skincare": "facial",
        "facialspas": "facial",

        "makeupartists": "makeup",
        "cosmetology_schools": "makeup",

        "waxing": "waxing",
        "laser_hair_removal": "hair removal",
        "threading": "eyebrow services",
        "eyebrowservices": "eyebrow services",

        "eyelashservice": "eyelash service",
    }

    # Extract aliases from Yelp categories
    aliases = []
    if isinstance(yelp_categories, list):
        for cat in yelp_categories:
            if isinstance(cat, dict) and "alias" in cat:
                aliases.append(cat["alias"].lower())
            elif isinstance(cat, str):
                aliases.append(cat.lower())

    # Find best match
    for alias in aliases:
        # Direct match
        if alias in category_map:
            return category_map[alias]

        # Partial match
        for key, value in category_map.items():
            if key in alias or alias in key:
                return value

    # Default fallback based on common patterns
    alias_str = " ".join(aliases)
    if "hair" in alias_str or "barber" in alias_str:
        return "hair salon"
    elif "nail" in alias_str:
        return "nail salon"
    elif "massage" in alias_str or "spa" in alias_str:
        return "spa"
    elif "skin" in alias_str or "facial" in alias_str:
        return "facial"

    # Ultimate fallback
    return "beauty salon"


# ============================================================================
# Example Usage
# ============================================================================

if __name__ == "__main__":
    # Test price estimation
    print("Price Estimation Examples:")
    print("-" * 50)

    test_cases = [
        ("$", "haircut"),
        ("$$", "haircut"),
        ("$$$", "massage"),
        ("$$", "nail salon"),
        ("$$$", "spa"),
        ("$$", "facial"),
    ]

    for price_range, category in test_cases:
        price = estimate_price_from_range(price_range, category)
        min_p, max_p = get_price_range_bounds(price_range, category)
        print(f"{price_range} {category}: ${price} (range: ${min_p}-${max_p})")

    print("\n" + "-" * 50)
    print("Service Generation Example:")
    print("-" * 50)

    services = generate_services_for_merchant("$$", "hair salon", "Test Salon")
    for service in services:
        print(f"  - {service['service_name']}: ${service['base_price']} ({service['duration_minutes']} min)")

    print("\n" + "-" * 50)
    print("Budget Check Examples:")
    print("-" * 50)

    budgets = [30, 50, 80, 100]
    for budget in budgets:
        fits = is_within_budget("$$", "haircut", budget)
        print(f"$$ haircut fits ${budget} budget: {fits}")
