#pragma once
#include <string>

namespace ecem2 {
inline int strlen(const std::string &str)
{
    return static_cast<int>(str.length());
}

inline std::string to_string(int val)
{
    return std::to_string(val);
}

inline std::string to_string(bool val)
{
    return val ? "true" : "false";
}

inline bool starts_with(const std::string &str, const std::string &prefix)
{
    return str.rfind(prefix, 0) == 0;
}

inline bool ends_with(const std::string &str, const std::string &suffix)
{
    if (suffix.size() > str.size())
        return false;
    return str.compare(str.size() - suffix.size(), suffix.size(), suffix) == 0;
}

inline bool contains(const std::string &str, const std::string &substr)
{
    return str.find(substr) != std::string::npos;
}
} // namespace ecem2
