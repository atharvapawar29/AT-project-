#include <ctype.h>
#include <stdio.h>
#include <string.h>

#define MAX_LEN 256

int is_symbol(char c) {
    return isalnum((unsigned char)c) != 0;
}

int precedence(char op) {
    if (op == '*') return 3;
    if (op == '.') return 2;
    if (op == '|') return 1;
    return 0;
}

void normalize_regex(const char *input, char *output) {
    int j = 0;
    for (int i = 0; input[i] != '\0' && j < MAX_LEN - 1; i++) {
        char c = input[i];
        if (isspace((unsigned char)c)) {
            continue;
        }
        if (c == '+') {
            c = '|';
        }
        output[j++] = c;
    }
    output[j] = '\0';
}

void add_concat(const char *regex, char *out) {
    int j = 0;
    for (int i = 0; regex[i] != '\0' && j < MAX_LEN - 2; i++) {
        char a = regex[i];
        char b = regex[i + 1];

        out[j++] = a;
        if (b == '\0') {
            break;
        }

        if ((is_symbol(a) || a == ')' || a == '*') &&
            (is_symbol(b) || b == '(')) {
            out[j++] = '.';
        }
    }
    out[j] = '\0';
}

int to_postfix(const char *infix, char *postfix) {
    char stack[MAX_LEN];
    int top = -1;
    int out = 0;

    for (int i = 0; infix[i] != '\0'; i++) {
        char c = infix[i];

        if (is_symbol(c)) {
            postfix[out++] = c;
        } else if (c == '(') {
            stack[++top] = c;
        } else if (c == ')') {
            while (top >= 0 && stack[top] != '(') {
                postfix[out++] = stack[top--];
            }
            if (top < 0) {
                return 0;
            }
            top--;
        } else if (c == '|' || c == '.' || c == '*') {
            while (top >= 0 && stack[top] != '(' && precedence(stack[top]) >= precedence(c)) {
                postfix[out++] = stack[top--];
            }
            stack[++top] = c;
        } else {
            return 0;
        }
    }

    while (top >= 0) {
        if (stack[top] == '(') {
            return 0;
        }
        postfix[out++] = stack[top--];
    }

    postfix[out] = '\0';
    return 1;
}

int main(void) {
    char input[MAX_LEN];
    char normalized[MAX_LEN];
    char infix[MAX_LEN];
    char postfix[MAX_LEN];

    printf("Enter regular expression: ");
    if (!fgets(input, sizeof(input), stdin)) {
        return 1;
    }

    input[strcspn(input, "\n")] = '\0';
    normalize_regex(input, normalized);
    add_concat(normalized, infix);

    if (!to_postfix(infix, postfix)) {
        printf("Invalid expression.\n");
        return 1;
    }

    printf("Normalized RE : %s\n", normalized);
    printf("With concat   : %s\n", infix);
    printf("Postfix       : %s\n", postfix);
    return 0;
}
