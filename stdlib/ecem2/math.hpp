#pragma once
#include <cmath>

namespace ecem2 {
inline int sqrt(int x)
{
    return static_cast<int>(std::sqrt(static_cast<double>(x)));
}

inline int pow(int base, int exp)
{
    return static_cast<int>(std::pow(static_cast<double>(base), static_cast<double>(exp)));
}

inline int abs(int x)
{
    return x < 0 ? -x : x;
}
} // namespace ecem2
