#pragma once
#include <string>

namespace ecem2 {
inline int strlen(const std::string &str)
{
    return static_cast<int>(str.length());
}
} // namespace ecem2
