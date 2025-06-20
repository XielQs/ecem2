#pragma once
#include <string>

namespace ecem2 {
namespace StringLiteral {
inline std::string upper(std::string obj)
{
    std::string res = obj;
    for (auto &c : res)
        c = toupper(c);
    return res;
}
} // namespace StringLiteral
} // namespace ecem2
