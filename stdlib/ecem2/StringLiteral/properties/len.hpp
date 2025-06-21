#pragma once
#include <string>

namespace ecem2 {
namespace StringLiteral {
inline int len(const std::string &obj)
{
    return static_cast<int>(obj.length());
}
} // namespace StringLiteral
} // namespace ecem2
