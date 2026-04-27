#include <stdio.h>

#define MAX_STATES 50
#define MAX_TRANSITIONS 500
#define EPSILON 'e'

typedef struct {
    int from;
    char symbol;
    int to;
} Transition;

int contains(int arr[], int n, int x) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == x) return 1;
    }
    return 0;
}

void epsilon_closure(int state, int closure[], int *closure_count,
                     Transition tr[], int tr_count) {
    int stack[MAX_STATES], top = -1;
    stack[++top] = state;
    closure[(*closure_count)++] = state;

    while (top >= 0) {
        int cur = stack[top--];
        for (int i = 0; i < tr_count; i++) {
            if (tr[i].from == cur && tr[i].symbol == EPSILON && !contains(closure, *closure_count, tr[i].to)) {
                closure[(*closure_count)++] = tr[i].to;
                stack[++top] = tr[i].to;
            }
        }
    }
}

int main(void) {
    int n_states, n_final, n_trans;
    int start_state;
    int finals[MAX_STATES];
    Transition tr[MAX_TRANSITIONS];

    printf("Enter number of states: ");
    scanf("%d", &n_states);

    printf("Enter start state: ");
    scanf("%d", &start_state);

    printf("Enter number of final states: ");
    scanf("%d", &n_final);
    printf("Enter final states: ");
    for (int i = 0; i < n_final; i++) scanf("%d", &finals[i]);

    printf("Enter number of transitions: ");
    scanf("%d", &n_trans);
    printf("Enter each transition as: from symbol to (use e for epsilon)\n");
    for (int i = 0; i < n_trans; i++) {
        scanf("%d %c %d", &tr[i].from, &tr[i].symbol, &tr[i].to);
    }

    char alphabet[MAX_STATES];
    int alpha_count = 0;
    for (int i = 0; i < n_trans; i++) {
        char s = tr[i].symbol;
        int seen = 0;
        if (s == EPSILON) continue;
        for (int j = 0; j < alpha_count; j++) {
            if (alphabet[j] == s) seen = 1;
        }
        if (!seen) alphabet[alpha_count++] = s;
    }

    int closure[MAX_STATES][MAX_STATES];
    int closure_count[MAX_STATES] = {0};
    for (int s = 0; s < n_states; s++) {
        epsilon_closure(s, closure[s], &closure_count[s], tr, n_trans);
    }

    int new_finals[MAX_STATES], new_final_count = 0;
    for (int s = 0; s < n_states; s++) {
        int make_final = 0;
        for (int i = 0; i < closure_count[s] && !make_final; i++) {
            if (contains(finals, n_final, closure[s][i])) {
                make_final = 1;
            }
        }
        if (make_final) new_finals[new_final_count++] = s;
    }

    printf("\nNFA Transition Table (without epsilon)\n");
    printf("Start state: %d\n", start_state);
    printf("Final states: ");
    for (int i = 0; i < new_final_count; i++) printf("%d ", new_finals[i]);
    printf("\n\nFrom\tSymbol\tTo\n");

    for (int s = 0; s < n_states; s++) {
        for (int a = 0; a < alpha_count; a++) {
            char sym = alphabet[a];
            int targets[MAX_STATES], target_count = 0;

            for (int i = 0; i < closure_count[s]; i++) {
                int p = closure[s][i];
                for (int t = 0; t < n_trans; t++) {
                    if (tr[t].from == p && tr[t].symbol == sym) {
                        int q = tr[t].to;
                        for (int k = 0; k < closure_count[q]; k++) {
                            int r = closure[q][k];
                            if (!contains(targets, target_count, r)) {
                                targets[target_count++] = r;
                            }
                        }
                    }
                }
            }

            for (int i = 0; i < target_count; i++) {
                printf("%d\t%c\t%d\n", s, sym, targets[i]);
            }
        }
    }

    return 0;
}
