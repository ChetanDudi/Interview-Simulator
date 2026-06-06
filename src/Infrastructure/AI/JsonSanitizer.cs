using System.Text;

namespace InterviewSimulator.Infrastructure.AI;

/// <summary>
/// Cleans raw AI output before JSON deserialization.
/// </summary>
internal static class JsonSanitizer
{
    /// <summary>
    /// Strips markdown code fences and finds the outermost JSON
    /// array or object boundary in the raw AI response.
    /// </summary>
    internal static string ExtractJson(string raw, bool expectArray = true)
    {
        var text = raw.Trim();

        // Strip ``` or ```json fences
        if (text.StartsWith("```"))
        {
            var lines = text.Split('\n');
            text = string.Join('\n', lines.Skip(1).TakeWhile(l => !l.TrimStart().StartsWith("```"))).Trim();
        }

        char open  = expectArray ? '[' : '{';
        char close = expectArray ? ']' : '}';
        var start  = text.IndexOf(open);
        var end    = text.LastIndexOf(close);
        if (start >= 0 && end > start)
            text = text[start..(end + 1)];

        return SanitizeControlChars(text);
    }

    /// <summary>
    /// Walks the JSON string and escapes bare control characters
    /// (0x00-0x1F) that appear inside string values. The AI often
    /// includes literal newlines in code answers, which are invalid JSON
    /// and cause '0x0A is invalid within a JSON string' parse errors.
    /// </summary>
    internal static string SanitizeControlChars(string json)
    {
        var sb       = new StringBuilder(json.Length + 64);
        bool inStr   = false;
        bool escaped = false;

        foreach (char c in json)
        {
            if (escaped)
            {
                sb.Append(c);
                escaped = false;
                continue;
            }

            if (c == '\\' && inStr)
            {
                sb.Append(c);
                escaped = true;
                continue;
            }

            if (c == '"')
            {
                inStr = !inStr;
                sb.Append(c);
                continue;
            }

            if (inStr && c < 0x20)
            {
                switch (c)
                {
                    case '\n': sb.Append("\\n");  break;
                    case '\r': sb.Append("\\r");  break;
                    case '\t': sb.Append("\\t");  break;
                    default:   sb.Append($"\\u{(int)c:x4}"); break;
                }
                continue;
            }

            sb.Append(c);
        }

        return sb.ToString();
    }
}
