#pragma once
#include <cmath>

namespace ecem2 {
inline int sqrt(int x)
{
    return static_cast<int>(std::sqrt(x));
}

inline int pow(int base, int exp)
{
    return static_cast<int>(std::pow(base, exp));
}

inline int abs(int x)
{
    return x < 0 ? -x : x;
}

template <typename... Args> inline int max(Args... args)
{
    int max_value = std::numeric_limits<int>::min();
    ((max_value = (args > max_value ? args : max_value)), ...);
    return max_value;
}

template <typename... Args> inline int min(Args... args)
{
    int min_value = std::numeric_limits<int>::max();
    ((min_value = (args < min_value ? args : min_value)), ...);
    return min_value;
}
} // namespace ecem2
