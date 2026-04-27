#include <stdio.h>
#include <string.h>

#define MAX_STATES 128
#define MAX_TRANSITIONS 512
#define EPSILON 'e'

typedef struct {
    int from;
    char symbol;
    int to;
} Transition;

typedef struct {
    int start;
    int end;
} Fragment;

typedef struct {
    int state_count;
    int transition_count;
    Transition transitions[MAX_TRANSITIONS];
    int start_state;
    int final_state;
} ENFA;

int is_symbol(char c) {
    return c != '.' && c != '|' && c != '*';
}

void add_transition(ENFA *g, int from, char symbol, int to) {
    g->transitions[g->transition_count++] = (Transition){from, symbol, to};
}

int postfix_to_enfa(const char *postfix, ENFA *g) {
    Fragment stack[MAX_STATES];
    int top = -1;
    int next_state = 0;

    g->state_count = 0;
    g->transition_count = 0;

    for (int i = 0; postfix[i] != '\0'; i++) {
        char c = postfix[i];

        if (is_symbol(c)) {
            int s = next_state++;
            int e = next_state++;
            add_transition(g, s, c, e);
            stack[++top] = (Fragment){s, e};
        } else if (c == '.') {
            if (top < 1) return 0;
            Fragment r = stack[top--];
            Fragment l = stack[top--];
            add_transition(g, l.end, EPSILON, r.start);
            stack[++top] = (Fragment){l.start, r.end};
        } else if (c == '|') {
            if (top < 1) return 0;
            Fragment r = stack[top--];
            Fragment l = stack[top--];
            int s = next_state++;
            int e = next_state++;
            add_transition(g, s, EPSILON, l.start);
            add_transition(g, s, EPSILON, r.start);
            add_transition(g, l.end, EPSILON, e);
            add_transition(g, r.end, EPSILON, e);
            stack[++top] = (Fragment){s, e};
        } else if (c == '*') {
            if (top < 0) return 0;
            Fragment n = stack[top--];
            int s = next_state++;
            int e = next_state++;
            add_transition(g, s, EPSILON, n.start);
            add_transition(g, s, EPSILON, e);
            add_transition(g, n.end, EPSILON, n.start);
            add_transition(g, n.end, EPSILON, e);
            stack[++top] = (Fragment){s, e};
        } else {
            return 0;
        }
    }

    if (top != 0) return 0;
    g->start_state = stack[0].start;
    g->final_state = stack[0].end;
    g->state_count = next_state;
    return 1;
}

int main(void) {
    char postfix[256];
    ENFA g;

    printf("Enter postfix expression: ");
    if (!fgets(postfix, sizeof(postfix), stdin)) {
        return 1;
    }
    postfix[strcspn(postfix, "\n")] = '\0';

    if (!postfix_to_enfa(postfix, &g)) {
        printf("Invalid postfix expression.\n");
        return 1;
    }

    printf("\nEpsilon-NFA Transition Table\n");
    printf("States: %d\n", g.state_count);
    printf("Start : %d\n", g.start_state);
    printf("Final : %d\n", g.final_state);
    printf("\nFrom\tSymbol\tTo\n");
    for (int i = 0; i < g.transition_count; i++) {
        printf("%d\t%c\t%d\n", g.transitions[i].from, g.transitions[i].symbol, g.transitions[i].to);
    }

    return 0;
}
