#pragma once
#include <string>

namespace ecem2 {
inline int strlen(const std::string &str)
{
    return static_cast<int>(str.length());
}

inline std::string to_upper(const std::string &s)
{
    std::string res = s;
    for (auto &c : res)
        c = toupper(c);
    return res;
}

inline std::string to_lower(const std::string &s)
{
    std::string res = s;
    for (auto &c : res)
        c = tolower(c);
    return res;
}

inline std::string to_string(int val)
{
    return std::to_string(val);
}

inline std::string to_string(bool val)
{
    return val ? "true" : "false";
}
} // namespace ecem2
